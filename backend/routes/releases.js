const express = require('express');
const prisma = require('../services/db');
const spotify = require('../services/spotify');

const router = express.Router();

// Get releases from all artists with Spotify data (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 24, search, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all approved artists with Spotify IDs
    const artists = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        spotifyId: { not: null },
      },
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        spotifyId: true,
      },
    });

    // Fetch releases from Spotify for each artist (with caching in production)
    const allReleases = [];

    for (const artist of artists) {
      try {
        const spotifyData = await spotify.getFullArtistData(artist.spotifyId);

        // Get albums
        if (spotifyData.discography?.albums) {
          for (const album of spotifyData.discography.albums) {
            allReleases.push({
              id: album.id,
              name: album.name,
              type: 'Album',
              image: album.image,
              releaseDate: album.releaseDate,
              url: album.url,
              artistName: artist.artistName,
              artistSlug: artist.profileSlug,
              artistId: artist.id,
            });
          }
        }

        // Get singles/EPs
        if (spotifyData.discography?.singles) {
          for (const single of spotifyData.discography.singles) {
            allReleases.push({
              id: single.id,
              name: single.name,
              type: single.type === 'single' ? 'Single' : 'EP',
              image: single.image,
              releaseDate: single.releaseDate,
              url: single.url,
              artistName: artist.artistName,
              artistSlug: artist.profileSlug,
              artistId: artist.id,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to fetch releases for ${artist.artistName}:`, err.message);
      }
    }

    // Sort by release date (newest first)
    allReleases.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
      const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
      return dateB - dateA;
    });

    // Filter by search query
    let filteredReleases = allReleases;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReleases = allReleases.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.artistName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by type
    if (type && type !== 'all') {
      filteredReleases = filteredReleases.filter(
        (r) => r.type.toLowerCase() === type.toLowerCase()
      );
    }

    // Paginate
    const paginatedReleases = filteredReleases.slice(skip, skip + parseInt(limit));

    res.json({
      releases: paginatedReleases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredReleases.length,
        pages: Math.ceil(filteredReleases.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get releases error:', error);
    res.status(500).json({ error: 'Failed to get releases' });
  }
});

module.exports = router;
