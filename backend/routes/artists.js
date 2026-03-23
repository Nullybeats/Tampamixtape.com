const express = require('express');
const prisma = require('../services/db');
const spotify = require('../services/spotify');
const cache = require('../services/cache');

const router = express.Router();

// Search for artists (in database and optionally Spotify)
router.get('/search', async (req, res) => {
  try {
    const { q, includeSpotify = 'true' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Search in database first
    const dbArtists = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        artistName: {
          contains: q,
          mode: 'insensitive',
        },
      },
      take: 10,
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        avatar: true,
        spotifyId: true,
        genres: true,
        region: true,
        popularity: true,
        followers: true,
      },
    });

    // If requested, also search Spotify
    let spotifyArtists = [];
    if (includeSpotify === 'true' && dbArtists.length < 5) {
      try {
        spotifyArtists = await spotify.searchArtist(q);
      } catch (err) {
        console.error('Spotify search failed:', err.message);
      }
    }

    // Combine database and Spotify results for compatibility
    // Frontend expects 'results' array with spotifyId field
    const combinedResults = [
      ...dbArtists,
      ...spotifyArtists.map(sa => ({
        id: sa.id,
        artistName: sa.name,
        spotifyId: sa.id,
        avatar: sa.image,
        genres: sa.genres?.join(', ') || '',
        followers: sa.followers,
        isSpotifyResult: true,
      })),
    ];

    res.json({
      artists: dbArtists,
      spotifyArtists,
      results: combinedResults, // For frontend compatibility
      total: combinedResults.length,
    });
  } catch (error) {
    console.error('Artist search error:', error.message);
    res.status(500).json({ error: 'Failed to search artists' });
  }
});

// Get full Spotify artist data by Spotify ID
router.get('/spotify/:spotifyId/full', async (req, res) => {
  try {
    const { spotifyId } = req.params;

    if (!spotifyId) {
      return res.status(400).json({ error: 'Spotify ID is required' });
    }

    // Validate Spotify ID format (22 character alphanumeric)
    if (!/^[a-zA-Z0-9]{22}$/.test(spotifyId)) {
      return res.status(400).json({ error: 'Invalid Spotify ID format' });
    }

    // Get full artist data from Spotify
    const artistData = await spotify.getFullArtistData(spotifyId);

    if (!artistData) {
      return res.status(404).json({ error: 'Artist not found on Spotify' });
    }

    res.json(artistData);
  } catch (error) {
    console.error('Get Spotify artist error:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Artist not found on Spotify' });
    }
    res.status(500).json({ error: 'Failed to fetch artist data from Spotify' });
  }
});

// Get Hot 100 - Top artists ranked by popularity
router.get('/hot100', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const cacheKey = `hot100:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
      return res.json(cached);
    }

    // Get all approved artists with Spotify IDs
    const artists = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        spotifyId: { not: null },
      },
      orderBy: [
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

    const result = {
      artists: rankedArtists,
      total: rankedArtists.length,
      updatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, result);
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.json(result);
  } catch (error) {
    console.error('Get Hot 100 error:', error);
    res.status(500).json({ error: 'Failed to get Hot 100' });
  }
});

// Refresh Hot 100 — returns fresh data from DB (no Spotify calls).
// The scheduler handles all Spotify API calls now.
router.post('/hot100/refresh', async (req, res) => {
  try {
    // Flush hot100 cache so next GET returns fresh DB data
    cache.keys().filter(k => k.startsWith('hot100:') || k === 'landing').forEach(k => cache.del(k));

    // Return current Hot 100 from DB
    const artists = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        spotifyId: { not: null },
      },
      orderBy: [
        { followers: 'desc' },
      ],
      take: 100,
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        avatar: true,
        spotifyId: true,
        spotifyUrl: true,
        followers: true,
        genres: true,
        region: true,
      },
    });

    const rankedArtists = artists.map((artist, index) => ({
      ...artist,
      rank: index + 1,
    }));

    res.json({
      message: 'Hot 100 cache refreshed from database',
      updated: rankedArtists.length,
      failed: 0,
      total: rankedArtists.length,
      results: rankedArtists,
    });
  } catch (error) {
    console.error('Refresh Hot 100 error:', error);
    res.status(500).json({ error: 'Failed to refresh artist data', details: error.message });
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
        orderBy = [{ followers: 'desc' }];
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
