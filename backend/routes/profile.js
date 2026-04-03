const express = require('express');
const crypto = require('crypto');
const prisma = require('../services/db');
const appleMusic = require('../services/applemusic');
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
        appleMusicId: true,
        appleMusicUrl: true,
        appleMusicCache: true,
        appleMusicCachedAt: true,
        demandScore: true,
        demandScoreTier: true,
        region: true,
        genres: true,
        instagramUrl: true,
        twitterUrl: true,
        youtubeUrl: true,
        tiktokUrl: true,
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

    // Use cached enriched data if available, otherwise fetch live (lightweight)
    let artistData = user.appleMusicCache || null;
    if (!artistData && user.appleMusicId) {
      try {
        artistData = await appleMusic.getFullArtistData(user.appleMusicId);
      } catch (err) {
        console.error('Failed to fetch Apple Music data:', err.message);
      }
    }

    // Fetch events in parallel (always live — events change frequently)
    const artistName = user.artistName;
    let eventsData = [];
    try {
      if (artistName) {
        eventsData = await events.getArtistEvents(artistName);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err.message);
    }

    // Strip cache fields from profile response
    const { appleMusicCache, appleMusicCachedAt, ...profile } = user;

    res.json({
      profile,
      artistData,
      events: eventsData,
    });

    // Fire-and-forget: track profile view (don't block response)
    if (user.role === 'ARTIST') {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
      const hashedIp = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Deduplicate: 1 view per IP per artist per hour
      prisma.profileView.findFirst({
        where: { artistId: user.id, viewerIp: hashedIp, createdAt: { gte: oneHourAgo } },
      }).then(existing => {
        if (!existing) {
          return prisma.profileView.create({
            data: { artistId: user.id, viewerIp: hashedIp },
          });
        }
      }).catch(() => {}); // Silent fail — view tracking is non-critical
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

module.exports = router;
