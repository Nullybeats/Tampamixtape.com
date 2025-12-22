const express = require('express');
const prisma = require('../services/db');
const spotify = require('../services/spotify');

const router = express.Router();

// Simple in-memory cache for releases (5 minute TTL)
let releasesCache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000, // 5 minutes
  isFetching: false, // Lock to prevent simultaneous fetches
  fetchPromise: null, // Promise to wait on if fetch is in progress
};

// Helper to check if error is rate limiting
function isRateLimitError(err) {
  return err.response?.status === 429 ||
         (err.message && err.message.includes('429'));
}

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
    } else if (releasesCache.isFetching && releasesCache.fetchPromise) {
      // Another request is already fetching - wait for it
      console.log('Waiting for existing fetch to complete...');
      allReleases = await releasesCache.fetchPromise;
    } else {
      // Set lock and start fetching
      releasesCache.isFetching = true;

      releasesCache.fetchPromise = (async () => {
        const releases = [];
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
          let retries = 0;
          const maxRetries = 3;

          while (retries < maxRetries) {
            try {
              // Use getArtistAlbums directly instead of getFullArtistData (1 API call vs 3)
              const albums = await spotify.getArtistAlbums(artist.spotifyId);

              if (albums && albums.length > 0) {
                for (const album of albums) {
                  releases.push({
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
              break; // Success, exit retry loop
            } catch (err) {
              const isRateLimit = isRateLimitError(err);
              if (isRateLimit && retries < maxRetries - 1) {
                // Rate limited - wait longer and retry
                const retryAfter = parseInt(err.response?.headers?.['retry-after']) || (Math.pow(2, retries + 1));
                console.log(`Rate limited for ${artist.artistName}, waiting ${retryAfter}s (retry ${retries + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                retries++;
              } else {
                console.error(`Failed to fetch releases for ${artist.artistName}:`, err.message);
                break; // Non-retryable error or max retries reached
              }
            }
          }
          // Delay between requests to avoid rate limiting (500ms)
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Sort by release date (newest first)
        releases.sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
          const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
          return dateB - dateA;
        });

        // Update cache
        releasesCache.data = releases;
        releasesCache.timestamp = Date.now();
        releasesCache.isFetching = false;
        releasesCache.fetchPromise = null;
        console.log(`Cached ${releases.length} releases`);

        return releases;
      })();

      try {
        allReleases = await releasesCache.fetchPromise;
      } catch (fetchError) {
        releasesCache.isFetching = false;
        releasesCache.fetchPromise = null;
        throw fetchError;
      }
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
