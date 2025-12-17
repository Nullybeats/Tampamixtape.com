const express = require('express');
const prisma = require('../services/db');
const spotify = require('../services/spotify');
const events = require('../services/events');

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

    // Fetch Spotify data and events in parallel for performance
    const artistName = user.artistName;
    const [spotifyData, eventsData] = await Promise.all([
      // Spotify data
      user.spotifyId
        ? spotify.getFullArtistData(user.spotifyId).catch(err => {
            console.error('Failed to fetch Spotify data:', err.message);
            return null;
          })
        : Promise.resolve(null),
      // Events data from Bandsintown
      artistName
        ? events.getArtistEvents(artistName).catch(err => {
            console.error('Failed to fetch events:', err.message);
            return [];
          })
        : Promise.resolve([]),
    ]);

    res.json({
      profile: user,
      spotifyData,
      events: eventsData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

module.exports = router;
