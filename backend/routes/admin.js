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
    const [totalUsers, pendingUsers, approvedUsers, artists, totalReleases] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'ARTIST' } }),
      prisma.release.count(),
    ]);

    res.json({
      totalUsers,
      pendingUsers,
      approvedUsers,
      artists,
      totalReleases,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Helper to check if error is rate limiting
function isRateLimitError(err) {
  return err.response?.status === 429 ||
         (err.message && err.message.includes('429'));
}

// Sync releases from Spotify to database
router.post('/sync-releases', requireAdmin, async (req, res) => {
  try {
    console.log('Starting releases sync...');

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

    console.log(`Syncing releases for ${artists.length} artists`);

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const errors = [];
    let rateLimitedUntil = null;

    // Fetch releases from Spotify for each artist
    for (const artist of artists) {
      let retries = 0;
      const maxRetries = 2;
      const maxWaitSeconds = 30; // Don't wait more than 30 seconds per retry

      while (retries < maxRetries) {
        try {
          const albums = await spotify.getArtistAlbums(artist.spotifyId);

          if (albums && albums.length > 0) {
            for (const album of albums) {
              const releaseData = {
                id: album.id,
                name: album.name,
                type: album.album_type === 'album' ? 'Album' : album.album_type === 'single' ? 'Single' : 'EP',
                image: album.images?.[0]?.url || null,
                releaseDate: album.release_date || null,
                spotifyUrl: album.external_urls?.spotify || null,
                artistId: artist.id,
                artistName: artist.artistName,
                artistSlug: artist.profileSlug,
              };

              // Upsert - create if doesn't exist, update if it does
              await prisma.release.upsert({
                where: { id: album.id },
                create: releaseData,
                update: {
                  name: releaseData.name,
                  type: releaseData.type,
                  image: releaseData.image,
                  releaseDate: releaseData.releaseDate,
                  spotifyUrl: releaseData.spotifyUrl,
                  artistName: releaseData.artistName,
                  artistSlug: releaseData.artistSlug,
                },
              });

              totalAdded++;
            }
          }
          console.log(`Synced ${albums?.length || 0} releases for ${artist.artistName}`);
          break; // Success, exit retry loop
        } catch (err) {
          const isRateLimit = isRateLimitError(err);
          if (isRateLimit) {
            const retryAfter = parseInt(err.response?.headers?.['retry-after']) || 60;

            // If wait time is too long, skip this artist and continue
            if (retryAfter > maxWaitSeconds) {
              console.log(`Rate limited for ${artist.artistName}, retry-after ${retryAfter}s is too long - skipping`);
              errors.push({
                artistName: artist.artistName,
                error: `Rate limited (retry in ${Math.ceil(retryAfter / 60)} min)`
              });
              totalSkipped++;

              // Track when rate limit will be lifted
              const unlockTime = new Date(Date.now() + retryAfter * 1000);
              if (!rateLimitedUntil || unlockTime > rateLimitedUntil) {
                rateLimitedUntil = unlockTime;
              }
              break;
            }

            // Wait and retry for short waits
            if (retries < maxRetries - 1) {
              console.log(`Rate limited for ${artist.artistName}, waiting ${retryAfter}s (retry ${retries + 1}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
              retries++;
            } else {
              console.error(`Failed to sync releases for ${artist.artistName} after retries`);
              errors.push({ artistName: artist.artistName, error: 'Rate limit exceeded' });
              totalFailed++;
              break;
            }
          } else {
            console.error(`Failed to sync releases for ${artist.artistName}:`, err.message);
            errors.push({ artistName: artist.artistName, error: err.message });
            totalFailed++;
            break;
          }
        }
      }

      // Delay between artists to avoid rate limiting (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get final count
    const totalReleases = await prisma.release.count();

    console.log(`Sync complete: ${totalAdded} releases processed, ${totalSkipped} skipped, ${totalFailed} failed`);

    const response = {
      message: totalSkipped > 0
        ? 'Releases sync partially complete - some artists skipped due to rate limiting'
        : 'Releases sync complete',
      processed: totalAdded,
      skipped: totalSkipped,
      failed: totalFailed,
      totalReleases,
      errors: errors.length > 0 ? errors : undefined,
    };

    // Add helpful message if rate limited
    if (rateLimitedUntil) {
      const waitMinutes = Math.ceil((rateLimitedUntil - Date.now()) / 60000);
      response.rateLimitMessage = `Spotify rate limit active. Try again in ~${waitMinutes} minutes to sync remaining artists.`;
    }

    res.json(response);
  } catch (error) {
    console.error('Sync releases error:', error);
    res.status(500).json({ error: 'Failed to sync releases', details: error.message });
  }
});

// Clear all releases (for troubleshooting)
router.delete('/releases', requireAdmin, async (req, res) => {
  try {
    const result = await prisma.release.deleteMany({});
    res.json({ message: 'All releases deleted', count: result.count });
  } catch (error) {
    console.error('Delete releases error:', error);
    res.status(500).json({ error: 'Failed to delete releases' });
  }
});

// Get auto-sync settings
router.get('/settings/auto-sync', requireAdmin, async (req, res) => {
  try {
    const scheduler = require('../services/scheduler');
    const status = await scheduler.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Get auto-sync settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update auto-sync settings
router.patch('/settings/auto-sync', requireAdmin, async (req, res) => {
  try {
    const { enabled, intervalMins } = req.body;

    // Validate interval (must be 30 minute increments, min 30, max 720 = 12 hours)
    if (intervalMins !== undefined) {
      if (intervalMins < 30 || intervalMins > 720 || intervalMins % 30 !== 0) {
        return res.status(400).json({
          error: 'Interval must be in 30-minute increments (30, 60, 90, etc.) up to 720 minutes (12 hours)',
        });
      }
    }

    const updateData = {};
    if (enabled !== undefined) updateData.autoSyncEnabled = enabled;
    if (intervalMins !== undefined) updateData.autoSyncIntervalMins = intervalMins;

    const settings = await prisma.settings.upsert({
      where: { id: 'app_settings' },
      create: {
        id: 'app_settings',
        ...updateData,
      },
      update: updateData,
    });

    // Restart scheduler with new settings
    const scheduler = require('../services/scheduler');
    await scheduler.restart();

    res.json({
      message: 'Auto-sync settings updated',
      enabled: settings.autoSyncEnabled,
      intervalMins: settings.autoSyncIntervalMins,
    });
  } catch (error) {
    console.error('Update auto-sync settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Trigger manual sync (uses scheduler's runSync)
router.post('/settings/sync-now', requireAdmin, async (req, res) => {
  try {
    const scheduler = require('../services/scheduler');
    const status = await scheduler.getStatus();

    if (status.isRunning) {
      return res.status(409).json({ error: 'Sync already in progress' });
    }

    // Run sync in background
    scheduler.runSync();

    res.json({ message: 'Sync started in background' });
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ error: 'Failed to start sync' });
  }
});

module.exports = router;
