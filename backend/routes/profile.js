const express = require('express');
const prisma = require('../services/db');
const spotify = require('../services/spotify');

const router = express.Router();

// Get public profile by slug (no auth required)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const user = await prisma.user.findUnique({
      where: { profileSlug: slug },
      select: {
        id: true,
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
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Only return approved profiles (or artists)
    if (user.status !== 'APPROVED') {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // If user has Spotify linked, fetch live data
    let spotifyData = null;
    if (user.spotifyId) {
      try {
        spotifyData = await spotify.getFullArtistData(user.spotifyId);
      } catch (spotifyError) {
        console.error('Failed to fetch Spotify data:', spotifyError.message);
        // Continue without Spotify data - don't fail the request
      }
    }

    res.json({
      profile: user,
      spotifyData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

module.exports = router;
