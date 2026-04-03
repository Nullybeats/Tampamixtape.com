const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../services/db');
const appleMusic = require('../services/applemusic');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// URL validation helper
const isValidUrl = (urlString) => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// Sanitize error messages to prevent PII leakage
const sanitizeErrorMessage = (error) => {
  const safeMessages = [
    'Artist not found on Apple Music',
    'Failed to fetch artist data from Apple Music',
    'Failed to search Apple Music',
  ];

  const errorMsg = error?.message || '';

  for (const safe of safeMessages) {
    if (errorMsg.includes(safe)) return safe;
  }

  return 'An error occurred';
};

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Fetch Apple Music artist data by URL or ID (public endpoint)
router.get('/artist', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Apple Music URL or artist ID is required' });
    }

    const artistId = appleMusic.extractArtistId(url);
    if (!artistId) {
      return res.status(400).json({ error: 'Invalid Apple Music artist URL or ID' });
    }

    const artistData = await appleMusic.getFullArtistData(artistId);
    if (!artistData) {
      return res.status(404).json({ error: 'Artist not found on Apple Music' });
    }
    res.json(artistData);
  } catch (error) {
    console.error('Fetch Apple Music artist error:', sanitizeErrorMessage(error));
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Artist not found on Apple Music' });
    }
    res.status(500).json({ error: 'Failed to fetch artist data from Apple Music' });
  }
});

// Search Apple Music artists
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const artists = await appleMusic.searchArtist(q);
    res.json({ artists });
  } catch (error) {
    console.error('Apple Music search error:', sanitizeErrorMessage(error));
    res.status(500).json({ error: 'Failed to search Apple Music' });
  }
});

// Link Apple Music artist to current user's profile
router.post('/link', requireAuth, async (req, res) => {
  try {
    const { appleMusicUrl } = req.body;

    if (!appleMusicUrl) {
      return res.status(400).json({ error: 'Apple Music URL is required' });
    }

    const artistId = appleMusic.extractArtistId(appleMusicUrl);
    if (!artistId) {
      return res.status(400).json({ error: 'Invalid Apple Music artist URL' });
    }

    // Fetch artist data to validate and get info
    const artistData = await appleMusic.getFullArtistData(artistId);
    if (!artistData) {
      return res.status(404).json({ error: 'Artist not found on Apple Music' });
    }

    // Update user with Apple Music info
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        appleMusicId: artistData.id,
        appleMusicUrl: artistData.url,
        // Optionally update avatar if user doesn't have one
        ...(artistData.image && { avatar: artistData.image }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        artistName: true,
        profileSlug: true,
        bio: true,
        avatar: true,
        role: true,
        status: true,
        appleMusicId: true,
        appleMusicUrl: true,
        region: true,
        instagramUrl: true,
        twitterUrl: true,
        youtubeUrl: true,
        tiktokUrl: true,
        websiteUrl: true,
      },
    });

    res.json({
      message: 'Apple Music profile linked successfully',
      user,
      artistData,
    });
  } catch (error) {
    console.error('Link Apple Music error:', sanitizeErrorMessage(error));
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Artist not found on Apple Music' });
    }
    res.status(500).json({ error: 'Failed to link Apple Music profile' });
  }
});

// Unlink Apple Music from current user's profile
router.delete('/link', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        appleMusicId: null,
        appleMusicUrl: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        artistName: true,
        profileSlug: true,
        bio: true,
        avatar: true,
        role: true,
        status: true,
        appleMusicId: true,
        appleMusicUrl: true,
        region: true,
        instagramUrl: true,
        twitterUrl: true,
        youtubeUrl: true,
        tiktokUrl: true,
        websiteUrl: true,
      },
    });

    res.json({
      message: 'Apple Music profile unlinked',
      user,
    });
  } catch (error) {
    console.error('Unlink Apple Music error:', sanitizeErrorMessage(error));
    res.status(500).json({ error: 'Failed to unlink Apple Music profile' });
  }
});

// Get current user's linked Apple Music data
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { appleMusicId: true, appleMusicUrl: true },
    });

    if (!user?.appleMusicId) {
      return res.json({ linked: false, artistData: null });
    }

    const artistData = await appleMusic.getFullArtistData(user.appleMusicId);
    res.json({
      linked: true,
      artistData,
    });
  } catch (error) {
    console.error('Get Apple Music me error:', sanitizeErrorMessage(error));
    res.status(500).json({ error: 'Failed to fetch Apple Music data' });
  }
});

module.exports = router;
