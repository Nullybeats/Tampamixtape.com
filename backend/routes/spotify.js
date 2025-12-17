const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../services/db');
const spotify = require('../services/spotify');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to optionally authenticate
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    }
  } catch (error) {
    // Token invalid, but that's okay for optional auth
  }
  next();
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

// Fetch Spotify artist data by URL or ID (public endpoint)
router.get('/artist', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Spotify URL or artist ID is required' });
    }

    const artistId = spotify.extractArtistId(url);
    if (!artistId) {
      return res.status(400).json({ error: 'Invalid Spotify artist URL or ID' });
    }

    const artistData = await spotify.getFullArtistData(artistId);
    res.json(artistData);
  } catch (error) {
    console.error('Fetch Spotify artist error:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Artist not found on Spotify' });
    }
    res.status(500).json({ error: 'Failed to fetch artist data from Spotify' });
  }
});

// Search Spotify artists
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const artists = await spotify.searchArtist(q);
    res.json({ artists });
  } catch (error) {
    console.error('Spotify search error:', error.message);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
});

// Link Spotify artist to current user's profile
router.post('/link', requireAuth, async (req, res) => {
  try {
    const { spotifyUrl } = req.body;

    if (!spotifyUrl) {
      return res.status(400).json({ error: 'Spotify URL is required' });
    }

    const artistId = spotify.extractArtistId(spotifyUrl);
    if (!artistId) {
      return res.status(400).json({ error: 'Invalid Spotify artist URL' });
    }

    // Fetch artist data to validate and get info
    const artistData = await spotify.getFullArtistData(artistId);

    // Update user with Spotify info
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        spotifyId: artistData.id,
        spotifyUrl: artistData.url,
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
        spotifyId: true,
        spotifyUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        websiteUrl: true,
      },
    });

    res.json({
      message: 'Spotify profile linked successfully',
      user,
      spotifyData: artistData,
    });
  } catch (error) {
    console.error('Link Spotify error:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Artist not found on Spotify' });
    }
    res.status(500).json({ error: 'Failed to link Spotify profile' });
  }
});

// Unlink Spotify from current user's profile
router.delete('/link', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        spotifyId: null,
        spotifyUrl: null,
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
        spotifyId: true,
        spotifyUrl: true,
      },
    });

    res.json({
      message: 'Spotify profile unlinked',
      user,
    });
  } catch (error) {
    console.error('Unlink Spotify error:', error.message);
    res.status(500).json({ error: 'Failed to unlink Spotify profile' });
  }
});

// Get current user's linked Spotify data
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { spotifyId: true, spotifyUrl: true },
    });

    if (!user?.spotifyId) {
      return res.json({ linked: false, spotifyData: null });
    }

    const artistData = await spotify.getFullArtistData(user.spotifyId);
    res.json({
      linked: true,
      spotifyData: artistData,
    });
  } catch (error) {
    console.error('Get Spotify me error:', error.message);
    res.status(500).json({ error: 'Failed to fetch Spotify data' });
  }
});

module.exports = router;
