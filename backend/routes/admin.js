const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../services/db');
const spotify = require('../services/spotify');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify admin
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all users (paginated with search and sorting)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, role, search, sortBy = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (role) where.role = role;

    // Add search filter (searches artistName, name, and email)
    if (search) {
      where.OR = [
        { artistName: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy based on sortBy parameter
    let orderBy = {};
    switch (sortBy) {
      case 'name':
        orderBy = { artistName: 'asc' };
        break;
      case 'name_desc':
        orderBy = { artistName: 'desc' };
        break;
      case 'email':
        orderBy = { email: 'asc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          artistName: true,
          profileSlug: true,
          avatar: true,
          role: true,
          status: true,
          region: true,
          genres: true,
          popularity: true,
          followers: true,
          spotifyId: true,
          instagramUrl: true,
          twitterUrl: true,
          youtubeUrl: true,
          tiktokUrl: true,
          websiteUrl: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Approve user
router.post('/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
    });

    res.json({ message: 'User approved', user: { id: user.id, status: user.status } });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject user
router.post('/users/:id/reject', requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });

    res.json({ message: 'User rejected', user: { id: user.id, status: user.status } });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// Update user role
router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ARTIST', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });

    res.json({ message: 'Role updated', user: { id: user.id, role: user.role } });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Comprehensive user update (role, status, spotify, region, genres, links)
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const {
      role,
      status,
      spotifyId,
      spotifyUrl,
      region,
      genres,
      instagramUrl,
      twitterUrl,
      youtubeUrl,
      tiktokUrl,
      websiteUrl,
    } = req.body;
    const updateData = {};

    // Validate and set role
    if (role !== undefined) {
      if (!['USER', 'ARTIST', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updateData.role = role;
    }

    // Validate and set status
    if (status !== undefined) {
      if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updateData.status = status;
    }

    // Validate and set region
    if (region !== undefined) {
      if (!['Tampa Bay', 'St. Pete'].includes(region)) {
        return res.status(400).json({ error: 'Invalid region' });
      }
      updateData.region = region;
    }

    // Set genres (comma-separated string)
    if (genres !== undefined) {
      updateData.genres = genres;
    }

    // Set Spotify fields (can be null to unlink)
    if (spotifyId !== undefined) {
      updateData.spotifyId = spotifyId;
    }
    if (spotifyUrl !== undefined) {
      updateData.spotifyUrl = spotifyUrl;
    }

    // Set social link fields (can be null to remove)
    if (instagramUrl !== undefined) {
      updateData.instagramUrl = instagramUrl;
    }
    if (twitterUrl !== undefined) {
      updateData.twitterUrl = twitterUrl;
    }
    if (youtubeUrl !== undefined) {
      updateData.youtubeUrl = youtubeUrl;
    }
    if (tiktokUrl !== undefined) {
      updateData.tiktokUrl = tiktokUrl;
    }
    if (websiteUrl !== undefined) {
      updateData.websiteUrl = websiteUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        artistName: true,
        profileSlug: true,
        avatar: true,
        role: true,
        status: true,
        region: true,
        genres: true,
        spotifyId: true,
        spotifyUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        youtubeUrl: true,
        tiktokUrl: true,
        websiteUrl: true,
      },
    });

    res.json({ message: 'User updated', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Create artist from Spotify URL (managed profile)
router.post('/users/create-from-spotify', requireAdmin, async (req, res) => {
  try {
    const { spotifyUrl } = req.body;

    // Validate input
    if (!spotifyUrl) {
      return res.status(400).json({ error: 'Spotify URL is required' });
    }

    // Extract artist ID from URL
    const artistId = spotify.extractArtistId(spotifyUrl);
    if (!artistId) {
      return res.status(400).json({ error: 'Invalid Spotify URL format' });
    }

    // Check if artist already exists
    const existingUser = await prisma.user.findFirst({
      where: { spotifyId: artistId },
    });
    if (existingUser) {
      return res.status(409).json({
        error: 'Artist already exists',
        existingUser: {
          id: existingUser.id,
          artistName: existingUser.artistName,
          profileSlug: existingUser.profileSlug,
        },
      });
    }

    // Fetch artist data from Spotify
    let spotifyData;
    try {
      spotifyData = await spotify.getFullArtistData(artistId);
    } catch (spotifyError) {
      console.error('Spotify fetch error:', spotifyError.message);
      return res.status(404).json({ error: 'Artist not found on Spotify' });
    }

    // Generate profile slug from artist name (no dashes, just lowercase alphanumeric)
    let baseSlug = spotifyData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ''); // Remove everything except letters and numbers

    // Fallback if slug is empty (artist name had no alphanumeric chars)
    if (!baseSlug) {
      baseSlug = `artist${artistId.substring(0, 8)}`;
    }

    // Ensure unique slug
    let profileSlug = baseSlug;
    let slugCounter = 1;
    while (await prisma.user.findUnique({ where: { profileSlug } })) {
      profileSlug = `${baseSlug}${slugCounter}`;
      slugCounter++;
    }

    // Generate placeholder email (for managed profiles)
    const placeholderEmail = `${artistId}@managed.tampamixtape.local`;

    // Create the managed profile
    const user = await prisma.user.create({
      data: {
        email: placeholderEmail,
        password: null, // Managed profile - no login
        artistName: spotifyData.name,
        profileSlug,
        avatar: spotifyData.image,
        role: 'ARTIST',
        status: 'APPROVED',
        spotifyId: artistId,
        spotifyUrl: spotifyData.url,
      },
      select: {
        id: true,
        email: true,
        artistName: true,
        profileSlug: true,
        avatar: true,
        role: true,
        status: true,
        spotifyId: true,
        spotifyUrl: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'Artist profile created',
      user,
      spotifyData: {
        name: spotifyData.name,
        followers: spotifyData.followers,
        genres: spotifyData.genres,
        image: spotifyData.image,
      },
    });
  } catch (error) {
    console.error('Create artist from Spotify error:', error);
    // Return more detailed error for debugging
    const errorMessage = error.code === 'P2002'
      ? 'Artist with this email or profile already exists'
      : error.message || 'Failed to create artist profile';
    res.status(500).json({ error: errorMessage, code: error.code });
  }
});

// Fix all profile slugs (remove hyphens)
router.post('/fix-slugs', requireAdmin, async (req, res) => {
  try {
    // Get all users with hyphens in their profileSlug
    const usersWithHyphens = await prisma.user.findMany({
      where: {
        profileSlug: {
          contains: '-',
        },
      },
      select: {
        id: true,
        profileSlug: true,
        artistName: true,
      },
    });

    let updated = 0;
    let skipped = 0;
    const results = [];

    for (const user of usersWithHyphens) {
      // Remove all hyphens from the slug
      const newSlug = user.profileSlug.replace(/-/g, '');

      // Check if new slug already exists (collision)
      const existingUser = await prisma.user.findUnique({
        where: { profileSlug: newSlug },
      });

      if (existingUser && existingUser.id !== user.id) {
        // Collision - add a number suffix
        let uniqueSlug = newSlug;
        let counter = 1;
        while (await prisma.user.findUnique({ where: { profileSlug: uniqueSlug } })) {
          uniqueSlug = `${newSlug}${counter}`;
          counter++;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { profileSlug: uniqueSlug },
        });

        results.push({
          artistName: user.artistName,
          oldSlug: user.profileSlug,
          newSlug: uniqueSlug,
          note: 'Added suffix to avoid collision',
        });
        updated++;
      } else {
        // No collision - update directly
        await prisma.user.update({
          where: { id: user.id },
          data: { profileSlug: newSlug },
        });

        results.push({
          artistName: user.artistName,
          oldSlug: user.profileSlug,
          newSlug: newSlug,
        });
        updated++;
      }
    }

    res.json({
      message: 'Profile slugs updated',
      updated,
      skipped,
      total: usersWithHyphens.length,
      results,
    });
  } catch (error) {
    console.error('Fix slugs error:', error);
    res.status(500).json({ error: 'Failed to fix slugs' });
  }
});

// Get dashboard stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, pendingUsers, approvedUsers, artists] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'ARTIST' } }),
    ]);

    res.json({
      totalUsers,
      pendingUsers,
      approvedUsers,
      artists,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
