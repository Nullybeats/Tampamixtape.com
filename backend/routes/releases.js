const express = require('express');
const prisma = require('../services/db');

const router = express.Router();

// Get releases from database (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 24, search, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { artistName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add type filter
    if (type && type !== 'all') {
      where.type = { equals: type, mode: 'insensitive' };
    }

    // Get releases and count in parallel
    const [releases, total] = await Promise.all([
      prisma.release.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { releaseDate: 'desc' },
        select: {
          id: true,
          name: true,
          type: true,
          image: true,
          releaseDate: true,
          spotifyUrl: true,
          artistId: true,
          artistName: true,
          artistSlug: true,
        },
      }),
      prisma.release.count({ where }),
    ]);

    // Transform to match expected format
    const formattedReleases = releases.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      image: r.image,
      releaseDate: r.releaseDate,
      url: r.spotifyUrl,
      artistName: r.artistName,
      artistSlug: r.artistSlug,
      artistId: r.artistId,
    }));

    res.json({
      releases: formattedReleases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get releases error:', error);
    res.status(500).json({ error: 'Failed to get releases' });
  }
});

// Get release stats (for homepage)
router.get('/stats', async (req, res) => {
  try {
    const [totalReleases, albumCount, singleCount] = await Promise.all([
      prisma.release.count(),
      prisma.release.count({ where: { type: 'Album' } }),
      prisma.release.count({ where: { type: 'Single' } }),
    ]);

    res.json({
      total: totalReleases,
      albums: albumCount,
      singles: singleCount,
    });
  } catch (error) {
    console.error('Get release stats error:', error);
    res.status(500).json({ error: 'Failed to get release stats' });
  }
});

module.exports = router;
