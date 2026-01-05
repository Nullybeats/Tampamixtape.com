const express = require('express');
const prisma = require('../services/db');

const router = express.Router();

// POST /api/claims - Submit a profile claim (public endpoint)
router.post('/', async (req, res) => {
  try {
    const {
      profileId,
      claimantEmail,
      instagramUrl,
      twitterUrl,
      tiktokUrl,
      youtubeUrl,
      websiteUrl,
      proofText,
      message,
    } = req.body;

    // Validation
    if (!profileId || !claimantEmail || !proofText) {
      return res.status(400).json({
        error: 'Profile ID, email, and proof of identity are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(claimantEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Require at least one social link
    const hasSocialLink = instagramUrl || twitterUrl || tiktokUrl || youtubeUrl || websiteUrl;
    if (!hasSocialLink) {
      return res.status(400).json({
        error: 'At least one social media link is required',
      });
    }

    // Verify the profile exists and is claimable
    const profile = await prisma.user.findUnique({
      where: { id: profileId },
      select: { id: true, email: true, artistName: true },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if profile is managed (claimable)
    if (!profile.email.endsWith('@managed.tampamixtape.local')) {
      return res.status(400).json({
        error: 'This profile is not available for claiming',
      });
    }

    // Check for existing pending claim by this email for this profile
    const existingClaim = await prisma.profileClaim.findFirst({
      where: {
        profileId,
        claimantEmail,
        status: 'PENDING',
      },
    });

    if (existingClaim) {
      return res.status(409).json({
        error: 'You already have a pending claim for this profile',
      });
    }

    // Check if claimant email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: claimantEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'This email is already registered. Please log in.',
      });
    }

    // Create the claim
    const claim = await prisma.profileClaim.create({
      data: {
        profileId,
        claimantEmail,
        instagramUrl: instagramUrl || null,
        twitterUrl: twitterUrl || null,
        tiktokUrl: tiktokUrl || null,
        youtubeUrl: youtubeUrl || null,
        websiteUrl: websiteUrl || null,
        proofText,
        message: message || null,
      },
    });

    // TODO: Send confirmation email via SendGrid
    // const emailService = require('../services/email');
    // emailService.sendClaimSubmittedEmail({ email: claimantEmail, artistName: profile.artistName });

    res.status(201).json({
      message: 'Claim submitted successfully. You will be notified once reviewed.',
      claimId: claim.id,
    });
  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

// GET /api/claims/check/:profileId - Check if profile is claimable (public)
router.get('/check/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await prisma.user.findUnique({
      where: { id: profileId },
      select: { id: true, email: true },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const isClaimable = profile.email.endsWith('@managed.tampamixtape.local');

    res.json({ isClaimable });
  } catch (error) {
    console.error('Check claimable error:', error);
    res.status(500).json({ error: 'Failed to check profile' });
  }
});

module.exports = router;
