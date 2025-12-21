const express = require('express');
const prisma = require('../services/db');
const spotify = require('../services/spotify');

const router = express.Router();

// Get Hot 100 - Top artists ranked by popularity
router.get('/hot100', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Get all approved artists with Spotify IDs
    const artists = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        spotifyId: { not: null },
      },
      orderBy: [
        { popularity: 'desc' },
        { followers: 'desc' },
      ],
      take: parseInt(limit),
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        avatar: true,
        spotifyId: true,
        spotifyUrl: true,
        popularity: true,
        followers: true,
        genres: true,
        region: true,
      },
    });

    // Add rank to each artist
    const rankedArtists = artists.map((artist, index) => ({
      ...artist,
      rank: index + 1,
    }));

    res.json({
      artists: rankedArtists,
      total: rankedArtists.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get Hot 100 error:', error);
    res.status(500).json({ error: 'Failed to get Hot 100' });
  }
});

// Refresh all artist data from Spotify (popularity, followers, genres, avatar)
router.post('/hot100/refresh', async (req, res) => {
  try {
    // Get all artists with Spotify IDs
    const artists = await prisma.user.findMany({
      where: {
        spotifyId: { not: null },
      },
      select: {
        id: true,
        spotifyId: true,
        artistName: true,
      },
    });

    let updated = 0;
    let failed = 0;
    const results = [];

    // Update each artist's data from Spotify
    for (const artist of artists) {
      try {
        const spotifyData = await spotify.getArtist(artist.spotifyId);
        if (spotifyData) {
          const updateData = {
            popularity: spotifyData.popularity || 0,
            followers: spotifyData.followers?.total || 0,
          };

          // Update genres if available (convert array to comma-separated string)
          if (spotifyData.genres && spotifyData.genres.length > 0) {
            updateData.genres = spotifyData.genres.join(', ');
          }

          // Update avatar if available and not already set
          if (spotifyData.images && spotifyData.images.length > 0) {
            updateData.avatar = spotifyData.images[0].url;
          }

          await prisma.user.update({
            where: { id: artist.id },
            data: updateData,
          });

          results.push({
            artistName: artist.artistName,
            popularity: updateData.popularity,
            followers: updateData.followers,
            genres: updateData.genres || 'none',
          });
          updated++;
        }
      } catch (err) {
        console.error(`Failed to update artist ${artist.spotifyId}:`, err.message);
        failed++;
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json({
      message: 'Artist data refresh complete',
      updated,
      failed,
      total: artists.length,
      results,
    });
  } catch (error) {
    console.error('Refresh Hot 100 error:', error);
    res.status(500).json({ error: 'Failed to refresh artist data' });
  }
});

// Get all approved artists (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 24, search, sortBy = 'name', genre, region } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      status: 'APPROVED',
      role: 'ARTIST',
    };

    // Add search filter
    if (search) {
      where.artistName = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Add genre filter (searches for genre in comma-separated string)
    if (genre && genre !== 'all') {
      where.genres = {
        contains: genre,
        mode: 'insensitive',
      };
    }

    // Add region filter
    if (region && region !== 'all') {
      where.region = region;
    }

    // Build orderBy
    let orderBy = {};
    switch (sortBy) {
      case 'name':
        orderBy = { artistName: 'asc' };
        break;
      case 'name_desc':
        orderBy = { artistName: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = [{ popularity: 'desc' }, { followers: 'desc' }];
        break;
      case 'followers':
        orderBy = { followers: 'desc' };
        break;
      default:
        orderBy = { artistName: 'asc' };
    }

    const [artists, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        select: {
          id: true,
          artistName: true,
          profileSlug: true,
          avatar: true,
          bio: true,
          spotifyId: true,
          genres: true,
          region: true,
          popularity: true,
          followers: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      artists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({ error: 'Failed to get artists' });
  }
});

module.exports = router;
