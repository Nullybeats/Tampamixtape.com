const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../services/db');
const appleMusic = require('../services/applemusic');
const emailService = require('../services/email');
const { syncSingleArtist, runSync, isSyncInProgress } = require('../services/scheduler');

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
          appleMusicId: true,
          appleMusicUrl: true,
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
      select: { id: true, status: true, artistName: true, profileSlug: true, appleMusicId: true },
    });

    // Sync releases from Apple Music in the background
    if (user.appleMusicId) {
      syncSingleArtist(user).catch(err =>
        console.error(`Post-approval sync failed for ${user.artistName}:`, err.message)
      );
    }

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

// Comprehensive user update (role, status, apple music, region, genres, links)
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const {
      role,
      status,
      appleMusicId,
      appleMusicUrl,
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

    // Set Apple Music fields (can be null to unlink)
    if (appleMusicId !== undefined) {
      if (appleMusicId !== null && appleMusicId !== '' && !appleMusic.isValidAppleMusicId(appleMusicId)) {
        return res.status(400).json({ error: 'Invalid Apple Music ID format. Must be a numeric string.' });
      }
      updateData.appleMusicId = appleMusicId || null;
      // Reset sync state when Apple Music ID changes
      if (appleMusicId) {
        updateData.syncEnabled = true;
        updateData.syncFailCount = 0;
        updateData.lastSyncError = null;
      }
    }
    if (appleMusicUrl !== undefined) {
      updateData.appleMusicUrl = appleMusicUrl;
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
        appleMusicId: true,
        appleMusicUrl: true,
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

// Create artist from Apple Music URL (managed profile)
router.post('/users/create-from-apple-music', requireAdmin, async (req, res) => {
  try {
    const { appleMusicUrl } = req.body;

    // Validate input
    if (!appleMusicUrl) {
      return res.status(400).json({ error: 'Apple Music URL is required' });
    }

    // Extract artist ID from URL
    const artistId = appleMusic.extractArtistId(appleMusicUrl);
    if (!artistId) {
      return res.status(400).json({ error: 'Invalid Apple Music URL format' });
    }

    // Check if artist already exists
    const existingUser = await prisma.user.findFirst({
      where: { appleMusicId: artistId },
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

    // Fetch artist data from Apple Music
    let artistData;
    try {
      artistData = await appleMusic.getFullArtistData(artistId);
    } catch (fetchError) {
      console.error('Apple Music fetch error:', fetchError.message);
      return res.status(404).json({ error: 'Artist not found on Apple Music' });
    }

    if (!artistData) {
      return res.status(404).json({ error: 'Artist not found on Apple Music' });
    }

    // Generate profile slug from artist name (no dashes, just lowercase alphanumeric)
    let baseSlug = artistData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Fallback if slug is empty
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
    const placeholderEmail = `am${artistId}@managed.tampamixtape.local`;

    // Create the managed profile
    const user = await prisma.user.create({
      data: {
        email: placeholderEmail,
        password: null,
        artistName: artistData.name,
        profileSlug,
        avatar: artistData.image,
        role: 'ARTIST',
        status: 'APPROVED',
        appleMusicId: artistId,
        appleMusicUrl: artistData.url,
      },
      select: {
        id: true,
        email: true,
        artistName: true,
        profileSlug: true,
        avatar: true,
        role: true,
        status: true,
        appleMusicId: true,
        appleMusicUrl: true,
        createdAt: true,
      },
    });

    // Sync releases from Apple Music in the background
    if (user.appleMusicId) {
      syncSingleArtist(user).catch(err =>
        console.error(`Post-creation sync failed for ${user.artistName}:`, err.message)
      );
    }

    res.status(201).json({
      message: 'Artist profile created',
      user,
      artistData: {
        name: artistData.name,
        genres: artistData.genres,
        image: artistData.image,
      },
    });
  } catch (error) {
    console.error('Create artist from Apple Music error:', error);
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

// Sync releases from Apple Music to database — delegates to scheduler
router.post('/sync-releases', requireAdmin, async (req, res) => {
  try {
    // Check if sync is already running
    if (isSyncInProgress()) {
      return res.status(409).json({ error: 'Sync already in progress. Please wait for it to complete.' });
    }

    // Trigger scheduler sync in background — don't block the response
    runSync();

    res.json({
      message: 'Sync started in background. The scheduler will process artists in chunks.',
    });
  } catch (error) {
    console.error('Sync releases error:', error);
    res.status(500).json({ error: 'Failed to start sync', details: error.message });
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

    // Validate interval (min 10 min, max 720 = 12 hours, 10-min increments)
    if (intervalMins !== undefined) {
      if (intervalMins < 10 || intervalMins > 720 || intervalMins % 10 !== 0) {
        return res.status(400).json({
          error: 'Interval must be in 10-minute increments (10, 20, 30, etc.) up to 720 minutes (12 hours)',
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

// Get advertisement settings (public - for footer)
router.get('/settings/ad', async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'app_settings' },
      select: {
        adImageUrl: true,
        adImageLink: true,
      },
    });

    res.json({
      imageUrl: settings?.adImageUrl || null,
      link: settings?.adImageLink || 'https://randyojedalaw.com',
    });
  } catch (error) {
    console.error('Get ad settings error:', error);
    res.status(500).json({ error: 'Failed to get ad settings' });
  }
});

// Update advertisement settings (admin only)
router.patch('/settings/ad', requireAdmin, async (req, res) => {
  try {
    const { imageData, link } = req.body;

    // Validate imageData if provided (should be base64 or URL)
    if (imageData && typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    // Validate link if provided
    if (link && typeof link !== 'string') {
      return res.status(400).json({ error: 'Invalid link' });
    }

    const updateData = {};
    if (imageData !== undefined) updateData.adImageUrl = imageData;
    if (link !== undefined) updateData.adImageLink = link;

    const settings = await prisma.settings.upsert({
      where: { id: 'app_settings' },
      create: {
        id: 'app_settings',
        ...updateData,
      },
      update: updateData,
    });

    res.json({
      message: 'Advertisement settings updated',
      imageUrl: settings.adImageUrl,
      link: settings.adImageLink,
    });
  } catch (error) {
    console.error('Update ad settings error:', error);
    res.status(500).json({ error: 'Failed to update ad settings' });
  }
});

// ============================================================================
// PROFILE CLAIMS MANAGEMENT
// ============================================================================

// GET /api/admin/claims - List all claims (paginated)
router.get('/claims', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    const [claims, total] = await Promise.all([
      prisma.profileClaim.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.profileClaim.count({ where }),
    ]);

    // Fetch profile info for each claim
    const profileIds = [...new Set(claims.map((c) => c.profileId))];
    const profiles = await prisma.user.findMany({
      where: { id: { in: profileIds } },
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        avatar: true,
        email: true,
      },
    });

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const claimsWithProfiles = claims.map((claim) => ({
      ...claim,
      profile: profileMap.get(claim.profileId) || null,
    }));

    res.json({
      claims: claimsWithProfiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ error: 'Failed to get claims' });
  }
});

// GET /api/admin/claims/stats - Get claim statistics
router.get('/claims/stats', requireAdmin, async (req, res) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      prisma.profileClaim.count({ where: { status: 'PENDING' } }),
      prisma.profileClaim.count({ where: { status: 'APPROVED' } }),
      prisma.profileClaim.count({ where: { status: 'REJECTED' } }),
    ]);

    res.json({ pending, approved, rejected, total: pending + approved + rejected });
  } catch (error) {
    console.error('Get claim stats error:', error);
    res.status(500).json({ error: 'Failed to get claim stats' });
  }
});

// POST /api/admin/claims/:id/approve - Approve a claim
router.post('/claims/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Get the claim
    const claim = await prisma.profileClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (claim.status !== 'PENDING') {
      return res.status(400).json({ error: 'Claim has already been processed' });
    }

    // Get the profile being claimed
    const profile = await prisma.user.findUnique({
      where: { id: claim.profileId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Generate a temporary password
    const bcrypt = require('bcryptjs');
    const tempPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Transaction: Update claim status and transfer profile ownership
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the claim status
      const updatedClaim = await tx.profileClaim.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: req.userId,
          reviewedAt: new Date(),
          reviewNotes: notes || null,
        },
      });

      // 2. Update the user profile with claimant's email and password
      const updatedProfile = await tx.user.update({
        where: { id: claim.profileId },
        data: {
          email: claim.claimantEmail,
          password: hashedPassword,
          // Update social links from claim if they were provided
          ...(claim.instagramUrl && { instagramUrl: claim.instagramUrl }),
          ...(claim.twitterUrl && { twitterUrl: claim.twitterUrl }),
          ...(claim.tiktokUrl && { tiktokUrl: claim.tiktokUrl }),
          ...(claim.youtubeUrl && { youtubeUrl: claim.youtubeUrl }),
          ...(claim.websiteUrl && { websiteUrl: claim.websiteUrl }),
        },
        select: {
          id: true,
          email: true,
          artistName: true,
          profileSlug: true,
          appleMusicId: true,
        },
      });

      return { claim: updatedClaim, profile: updatedProfile };
    });

    // Sync releases from Apple Music in the background
    if (result.profile.appleMusicId) {
      syncSingleArtist(result.profile).catch(err =>
        console.error(`Post-claim sync failed for ${result.profile.artistName}:`, err.message)
      );
    }

    // Send email notification to claimant with login credentials
    emailService.sendClaimApprovedEmail({
      email: result.profile.email,
      artistName: result.profile.artistName,
      tempPassword,
    });

    res.json({
      message: 'Claim approved. Profile ownership transferred.',
      profile: result.profile,
      temporaryPassword: tempPassword, // Return for admin to share
    });
  } catch (error) {
    console.error('Approve claim error:', error);
    res.status(500).json({ error: 'Failed to approve claim' });
  }
});

// POST /api/admin/claims/:id/reject - Reject a claim
router.post('/claims/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const claim = await prisma.profileClaim.findUnique({
      where: { id },
      include: {
        profile: {
          select: { artistName: true },
        },
      },
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (claim.status !== 'PENDING') {
      return res.status(400).json({ error: 'Claim has already been processed' });
    }

    const updatedClaim = await prisma.profileClaim.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        reviewNotes: reason || null,
      },
    });

    // Send email notification to claimant about rejection
    emailService.sendClaimRejectedEmail({
      email: claim.claimantEmail,
      artistName: claim.profile?.artistName || 'the requested profile',
      reason,
    });

    res.json({
      message: 'Claim rejected',
      claim: updatedClaim,
    });
  } catch (error) {
    console.error('Reject claim error:', error);
    res.status(500).json({ error: 'Failed to reject claim' });
  }
});

// ==============================
// Sync monitoring endpoints
// ==============================

// GET /api/admin/sync-logs - Paginated sync history
router.get('/sync-logs', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.syncLog.count(),
    ]);

    // Parse JSON errors field
    const formatted = logs.map(log => ({
      ...log,
      errors: log.errors ? JSON.parse(log.errors) : null,
    }));

    res.json({
      logs: formatted,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get sync logs error:', error);
    res.status(500).json({ error: 'Failed to get sync logs' });
  }
});

// GET /api/admin/artists/sync-status - Artists sorted by sync health
router.get('/artists/sync-status', requireAdmin, async (req, res) => {
  try {
    const { filter = 'all' } = req.query;

    const where = {
      role: 'ARTIST',
      appleMusicId: { not: null },
    };

    if (filter === 'quarantined') {
      where.syncEnabled = false;
    } else if (filter === 'failing') {
      where.syncFailCount = { gt: 0 };
      where.syncEnabled = true;
    } else if (filter === 'stale') {
      where.syncEnabled = true;
      where.OR = [
        { lastSyncedAt: null },
        { lastSyncedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ];
    }

    const artists = await prisma.user.findMany({
      where,
      orderBy: [
        { syncEnabled: 'asc' }, // quarantined first
        { syncFailCount: 'desc' },
        { lastSyncedAt: 'asc' },
      ],
      select: {
        id: true,
        artistName: true,
        appleMusicId: true,
        syncEnabled: true,
        syncFailCount: true,
        lastSyncedAt: true,
        lastSyncError: true,
        status: true,
      },
    });

    // Summary counts
    const allArtists = await prisma.user.findMany({
      where: { role: 'ARTIST', appleMusicId: { not: null } },
      select: { syncEnabled: true, syncFailCount: true, lastSyncedAt: true },
    });

    const summary = {
      total: allArtists.length,
      quarantined: allArtists.filter(a => !a.syncEnabled).length,
      failing: allArtists.filter(a => a.syncEnabled && a.syncFailCount > 0).length,
      stale: allArtists.filter(a => a.syncEnabled && (!a.lastSyncedAt || Date.now() - new Date(a.lastSyncedAt).getTime() > 24 * 60 * 60 * 1000)).length,
      healthy: allArtists.filter(a => a.syncEnabled && a.syncFailCount === 0 && a.lastSyncedAt && Date.now() - new Date(a.lastSyncedAt).getTime() <= 24 * 60 * 60 * 1000).length,
    };

    res.json({ artists, summary });
  } catch (error) {
    console.error('Get artist sync status error:', error);
    res.status(500).json({ error: 'Failed to get artist sync status' });
  }
});

// POST /api/admin/artists/:id/reset-sync - Re-enable a quarantined artist
router.post('/artists/:id/reset-sync', requireAdmin, async (req, res) => {
  try {
    const artist = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        syncEnabled: true,
        syncFailCount: 0,
        lastSyncError: null,
      },
      select: {
        id: true,
        artistName: true,
        appleMusicId: true,
        syncEnabled: true,
      },
    });

    res.json({ message: `Sync re-enabled for ${artist.artistName}`, artist });
  } catch (error) {
    console.error('Reset sync error:', error);
    res.status(500).json({ error: 'Failed to reset sync' });
  }
});

module.exports = router;
