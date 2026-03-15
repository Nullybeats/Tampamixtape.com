const express = require('express');
const prisma = require('../services/db');
const cache = require('../services/cache');

const router = express.Router();

// Consolidated landing page data endpoint
router.get('/landing', async (req, res) => {
  try {
    const cached = cache.get('landing');
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
      return res.json(cached);
    }

    // Run all queries in parallel
    const [artists, releases, totalReleases, albumCount, singleCount, settings] = await Promise.all([
      // Top 50 artists - covers Hero, TrendingSection, Hot100Section
      prisma.user.findMany({
        where: {
          status: 'APPROVED',
          role: 'ARTIST',
          spotifyId: { not: null },
        },
        orderBy: [
          { popularity: 'desc' },
          { followers: 'desc' },
        ],
        take: 50,
        select: {
          id: true,
          artistName: true,
          profileSlug: true,
          avatar: true,
          spotifyId: true,
          spotifyUrl: true,
          popularity: true,
          followers: true,
          genres: true,
          region: true,
        },
      }),
      // 10 recent releases - covers TrendingSection + DiscoverySection
      prisma.release.findMany({
        take: 10,
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
      // Release stats for Hero
      prisma.release.count(),
      prisma.release.count({ where: { type: 'Album' } }),
      prisma.release.count({ where: { type: 'Single' } }),
      // Ad settings for Footer
      prisma.settings.findUnique({
        where: { id: 'app_settings' },
        select: {
          adImageUrl: true,
          adImageLink: true,
        },
      }),
    ]);

    // Add rank to artists
    const rankedArtists = artists.map((artist, index) => ({
      ...artist,
      rank: index + 1,
    }));

    // Format releases
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

    // Calculate total followers from artists
    const totalFollowers = rankedArtists.reduce((sum, a) => sum + (a.followers || 0), 0);

    const result = {
      artists: rankedArtists,
      releases: formattedReleases,
      stats: {
        artistCount: rankedArtists.length,
        albums: albumCount,
        singles: singleCount,
        totalReleases,
        totalFollowers,
      },
      ad: {
        imageUrl: settings?.adImageUrl || null,
        link: settings?.adImageLink || 'https://randyojedalaw.com',
      },
      updatedAt: new Date().toISOString(),
    };

    cache.set('landing', result, 300);
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.json(result);
  } catch (error) {
    console.error('Get landing data error:', error);
    res.status(500).json({ error: 'Failed to get landing data' });
  }
});

module.exports = router;
