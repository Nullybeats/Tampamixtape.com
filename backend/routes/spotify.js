const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../services/db');
const spotify = require('../services/spotify');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Allowlist for redirect URIs to prevent open redirect attacks
const ALLOWED_REDIRECT_URIS = [
  `${FRONTEND_URL}/callback`,
  'http://localhost:5173/callback',
  'http://localhost:3000/callback',
];

// Add production URLs from environment if set
if (process.env.ALLOWED_REDIRECT_URIS) {
  const additionalUris = process.env.ALLOWED_REDIRECT_URIS.split(',').map(uri => uri.trim());
  ALLOWED_REDIRECT_URIS.push(...additionalUris);
}

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
  // Only return safe, generic messages
  const safeMessages = [
    'Invalid or expired authorization code',
    'Artist not found on Spotify',
    'Failed to fetch artist data from Spotify',
    'Failed to search Spotify',
  ];

  const errorMsg = error?.message || '';

  // Check if it's a known safe message
  for (const safe of safeMessages) {
    if (errorMsg.includes(safe)) return safe;
  }

  // Return generic message to avoid leaking sensitive info
  return 'An error occurred';
};

// Store OAuth states temporarily (in production, use Redis or database)
const oauthStates = new Map();

// Temporary server-side store for Spotify payloads (short-lived)
const oauthPayloads = new Map();
const PAYLOAD_TTL_MS = parseInt(process.env.SPOTIFY_PAYLOAD_TTL_MS, 10) || 2 * 60 * 1000; // default 2 minutes

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
    console.error('Fetch Spotify artist error:', sanitizeErrorMessage(error));
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
    console.error('Spotify search error:', sanitizeErrorMessage(error));
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
    console.error('Link Spotify error:', sanitizeErrorMessage(error));
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
    console.error('Unlink Spotify error:', sanitizeErrorMessage(error));
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
    console.error('Get Spotify me error:', sanitizeErrorMessage(error));
    res.status(500).json({ error: 'Failed to fetch Spotify data' });
  }
});

// ===========================================
// OAuth Authorization Code Flow Endpoints
// ===========================================

// Clean up expired states (older than 10 minutes)
function cleanupExpiredStates() {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [state, data] of oauthStates.entries()) {
    if (data.createdAt < tenMinutesAgo) {
      oauthStates.delete(state);
    }
  }
}

function cleanupExpiredPayloads() {
  const cutoff = Date.now() - PAYLOAD_TTL_MS;
  for (const [token, stored] of oauthPayloads.entries()) {
    if (stored.createdAt < cutoff) {
      oauthPayloads.delete(token);
    }
  }
}

// Run periodic cleanup for payloads
setInterval(cleanupExpiredPayloads, 60 * 1000);

// Step 1: Generate authorization URL and redirect
router.get('/auth/login', (req, res) => {
  try {
    // Clean up old states
    cleanupExpiredStates();

    // Generate a secure random state
    const state = crypto.randomBytes(16).toString('hex');

    // Get redirect URI from query or use default
    const redirectUri = req.query.redirect_uri || `${FRONTEND_URL}/callback`;

    // Validate redirect_uri against allowlist
    if (!ALLOWED_REDIRECT_URIS.includes(redirectUri)) {
      return res.status(400).json({ error: 'Invalid redirect_uri' });
    }

    // Store state with metadata
    oauthStates.set(state, {
      createdAt: Date.now(),
      redirectUri,
      returnTo: req.query.return_to || '/',
    });

    // Generate authorization URL
    const authUrl = spotify.getAuthorizationUrl(state, redirectUri);

    res.json({ authUrl, state });
  } catch (error) {
    console.error('Spotify auth login error:', sanitizeErrorMessage(error));
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// Step 2: Handle callback from Spotify
router.get('/auth/callback', async (req, res) => {
  try {
    const { code, state, error: spotifyError } = req.query;

    // Handle Spotify errors
    if (spotifyError) {
      console.error('Spotify auth error:', spotifyError);
      return res.redirect(`${FRONTEND_URL}/callback?error=${encodeURIComponent(spotifyError)}`);
    }

    // Validate state
    if (!state || !oauthStates.has(state)) {
      return res.redirect(`${FRONTEND_URL}/callback?error=invalid_state`);
    }

    const stateData = oauthStates.get(state);
    oauthStates.delete(state); // Use state only once

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/callback?error=no_code`);
    }

    // Exchange code for tokens
    const tokens = await spotify.exchangeCodeForToken(code, stateData.redirectUri);

    // Get user's Spotify profile
    const spotifyProfile = await spotify.getSpotifyUserProfile(tokens.accessToken);

    // Try to find if user is a Spotify artist
    let artistData = null;
    if (spotifyProfile.displayName) {
      artistData = await spotify.findArtistByName(spotifyProfile.displayName);
    }

    // Store full payload server-side and redirect with a short-lived token
    const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    oauthPayloads.set(token, {
      createdAt: Date.now(),
      data: {
        spotifyProfile,
        artistData,
        returnTo: stateData.returnTo,
      },
    });

    // Redirect to frontend with only the token; frontend should call the exchange endpoint
    res.redirect(`${FRONTEND_URL}/callback?spotify_token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('Spotify auth callback error:', sanitizeErrorMessage(error));
    res.redirect(`${FRONTEND_URL}/callback?error=${encodeURIComponent('callback_failed')}`);
  }
});

// Step 3: Exchange code for user data (alternative to redirect flow)
router.post('/auth/exchange', async (req, res) => {
  try {
    const { code, redirectUri, state } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'Code and redirectUri are required' });
    }

    // Validate redirectUri against allowlist to prevent open redirect
    if (!ALLOWED_REDIRECT_URIS.includes(redirectUri)) {
      return res.status(400).json({ error: 'Invalid redirect_uri' });
    }

    // Validate state if provided (CSRF protection)
    if (state) {
      if (!oauthStates.has(state)) {
        return res.status(400).json({ error: 'Invalid or expired state parameter' });
      }
      // Consume the state (single use)
      oauthStates.delete(state);
    }

    // Exchange code for tokens
    const tokens = await spotify.exchangeCodeForToken(code, redirectUri);

    // Get user's Spotify profile
    const spotifyProfile = await spotify.getSpotifyUserProfile(tokens.accessToken);

    // Try to find if user is a Spotify artist
    let artistData = null;
    if (spotifyProfile.displayName) {
      artistData = await spotify.findArtistByName(spotifyProfile.displayName);
    }

    res.json({
      spotifyProfile,
      artistData,
      // Don't send tokens to frontend for security
    });
  } catch (error) {
    console.error('Spotify auth exchange error:', sanitizeErrorMessage(error));
    if (error.response?.status === 400) {
      return res.status(400).json({ error: 'Invalid or expired authorization code' });
    }
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

// Endpoint for frontend to exchange short-lived token for the stored payload
router.get('/auth/result', async (req, res) => {
  try {
    const token = req.query.token || req.query.spotify_token;
    if (!token) {
      return res.status(400).json({ error: 'token_required' });
    }

    const stored = oauthPayloads.get(token);
    if (!stored) {
      return res.status(404).json({ error: 'not_found_or_expired' });
    }

    // Make this single-use: remove after retrieval
    oauthPayloads.delete(token);

    return res.json(stored.data);
  } catch (error) {
    console.error('Token exchange error:', sanitizeErrorMessage(error));
    return res.status(500).json({ error: 'token_exchange_failed' });
  }
});

// Connect Spotify to existing authenticated user
router.post('/auth/connect', requireAuth, async (req, res) => {
  try {
    const { code, redirectUri, state } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'Code and redirectUri are required' });
    }

    // Validate redirectUri against allowlist to prevent open redirect
    if (!ALLOWED_REDIRECT_URIS.includes(redirectUri)) {
      return res.status(400).json({ error: 'Invalid redirect_uri' });
    }

    // Validate state if provided (CSRF protection)
    if (state) {
      if (!oauthStates.has(state)) {
        return res.status(400).json({ error: 'Invalid or expired state parameter' });
      }
      oauthStates.delete(state);
    }

    // Exchange code for tokens
    const tokens = await spotify.exchangeCodeForToken(code, redirectUri);

    // Get user's Spotify profile
    const spotifyProfile = await spotify.getSpotifyUserProfile(tokens.accessToken);

    // Try to find artist data
    let artistData = null;
    if (spotifyProfile.displayName) {
      artistData = await spotify.findArtistByName(spotifyProfile.displayName);
    }

    // Update user with Spotify info
    const updateData = {
      spotifyId: artistData?.id || null,
      spotifyUrl: artistData?.url || spotifyProfile.externalUrls?.spotify || null,
    };

    // Update avatar if artist has an image
    if (artistData?.image) {
      updateData.avatar = artistData.image;
    } else if (spotifyProfile.images?.[0]?.url) {
      updateData.avatar = spotifyProfile.images[0].url;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
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
      message: 'Spotify connected successfully',
      user,
      spotifyProfile,
      artistData,
    });
  } catch (error) {
    console.error('Spotify auth connect error:', sanitizeErrorMessage(error));
    if (error.response?.status === 400) {
      return res.status(400).json({ error: 'Invalid or expired authorization code' });
    }
    res.status(500).json({ error: 'Failed to connect Spotify' });
  }
});

module.exports = router;
