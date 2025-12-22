const express = require('express');
const prisma = require('../services/db');
const spotify = require('../services/spotify');

const router = express.Router();

// Simple in-memory cache for releases (5 minute TTL)
let releasesCache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000, // 5 minutes
};

// Get releases from all artists with Spotify data (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 24, search, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let allReleases = [];

    // Check cache first
    const now = Date.now();
    if (releasesCache.data && (now - releasesCache.timestamp) < releasesCache.TTL) {
      console.log('Using cached releases');
      allReleases = releasesCache.data;
    } else {
      console.log('Fetching fresh releases from Spotify');

      // Get all approved artists with Spotify IDs
      const artists = await prisma.user.findMany({
        where: {
          status: 'APPROVED',
          role: 'ARTIST',
          spotifyId: { not: null },
        },
        select: {
          id: true,
          artistName: true,
          profileSlug: true,
          spotifyId: true,
        },
      });

      console.log(`Fetching releases for ${artists.length} artists`);

      // Fetch releases from Spotify for each artist (just albums, faster than full data)
      for (const artist of artists) {
        try {
          // Use getArtistAlbums directly instead of getFullArtistData (1 API call vs 3)
          const albums = await spotify.getArtistAlbums(artist.spotifyId);

          if (albums && albums.length > 0) {
            for (const album of albums) {
              allReleases.push({
                id: album.id,
                name: album.name,
                type: album.album_type === 'album' ? 'Album' : album.album_type === 'single' ? 'Single' : 'EP',
                image: album.images?.[0]?.url,
                releaseDate: album.release_date,
                url: album.external_urls?.spotify,
                artistName: artist.artistName,
                artistSlug: artist.profileSlug,
                artistId: artist.id,
              });
            }
          }
        } catch (err) {
          console.error(`Failed to fetch releases for ${artist.artistName}:`, err.message);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Sort by release date (newest first)
      allReleases.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
        const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
        return dateB - dateA;
      });

      // Update cache
      releasesCache.data = allReleases;
      releasesCache.timestamp = now;
      console.log(`Cached ${allReleases.length} releases`);
    }

    // Filter by search query
    let filteredReleases = allReleases;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReleases = allReleases.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.artistName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by type
    if (type && type !== 'all') {
      filteredReleases = filteredReleases.filter(
        (r) => r.type.toLowerCase() === type.toLowerCase()
      );
    }

    // Paginate
    const paginatedReleases = filteredReleases.slice(skip, skip + parseInt(limit));

    res.json({
      releases: paginatedReleases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredReleases.length,
        pages: Math.ceil(filteredReleases.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get releases error:', error);
    res.status(500).json({ error: 'Failed to get releases' });
  }
});

// Clear cache endpoint (for admin use)
router.post('/clear-cache', (req, res) => {
  releasesCache.data = null;
  releasesCache.timestamp = 0;
  res.json({ message: 'Releases cache cleared' });
});

module.exports = router;
