const express = require('express');
const prisma = require('../services/db');
const appleMusic = require('../services/applemusic');
const cache = require('../services/cache');

const router = express.Router();

// Search for artists (in database and optionally Apple Music)
router.get('/search', async (req, res) => {
  try {
    const { q, includeAppleMusic = 'true' } = req.query;

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
        appleMusicId: true,
        genres: true,
        region: true,
        popularity: true,
        followers: true,
      },
    });

    // If requested, also search Apple Music
    let appleMusicArtists = [];
    if (includeAppleMusic === 'true' && dbArtists.length < 5) {
      try {
        appleMusicArtists = await appleMusic.searchArtist(q);
      } catch (err) {
        console.error('Apple Music search failed:', err.message);
      }
    }

    // Combine database and Apple Music results
    const combinedResults = [
      ...dbArtists,
      ...appleMusicArtists.map(a => ({
        id: a.id,
        artistName: a.name,
        appleMusicId: a.id,
        avatar: a.artwork,
        genres: a.genres?.join(', ') || '',
        isAppleMusicResult: true,
      })),
    ];

    res.json({
      artists: dbArtists,
      appleMusicArtists,
      results: combinedResults,
      total: combinedResults.length,
    });
  } catch (error) {
    console.error('Artist search error:', error.message);
    res.status(500).json({ error: 'Failed to search artists' });
  }
});

// Get full Apple Music artist data by Apple Music ID
router.get('/apple-music/:appleMusicId/full', async (req, res) => {
  try {
    const { appleMusicId } = req.params;

    if (!appleMusicId) {
      return res.status(400).json({ error: 'Apple Music ID is required' });
    }

    // Validate Apple Music ID format (numeric string)
    if (!/^\d+$/.test(appleMusicId)) {
      return res.status(400).json({ error: 'Invalid Apple Music ID format' });
    }

    // Get full artist data from Apple Music
    const artistData = await appleMusic.getFullArtistData(appleMusicId);

    if (!artistData) {
      return res.status(404).json({ error: 'Artist not found on Apple Music' });
    }

    res.json(artistData);
  } catch (error) {
    console.error('Get Apple Music artist error:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Artist not found on Apple Music' });
    }
    res.status(500).json({ error: 'Failed to fetch artist data from Apple Music' });
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

    // Get all approved artists with Apple Music IDs
    const artists = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        appleMusicId: { not: null },
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
        appleMusicId: true,
        appleMusicUrl: true,
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

// Refresh Hot 100 — returns fresh data from DB (no API calls).
router.post('/hot100/refresh', async (req, res) => {
  try {
    // Flush hot100 cache so next GET returns fresh DB data
    cache.keys().filter(k => k.startsWith('hot100:') || k === 'landing').forEach(k => cache.del(k));

    // Return current Hot 100 from DB
    const artists = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        appleMusicId: { not: null },
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
        appleMusicId: true,
        appleMusicUrl: true,
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
          appleMusicId: true,
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
