const express = require('express');
const prisma = require('../services/db');

const router = express.Router();

// Get all approved artists (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 24, search, sortBy = 'name' } = req.query;
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
