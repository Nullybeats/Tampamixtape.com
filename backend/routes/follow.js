const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')

const prisma = new PrismaClient()

// Follow an artist
router.post('/:artistId', authenticateToken, async (req, res) => {
  try {
    const { artistId } = req.params
    const followerId = req.user.id

    // Can't follow yourself
    if (artistId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    // Check if artist exists
    const artist = await prisma.user.findUnique({
      where: { id: artistId }
    })

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' })
    }

    // Create follow (upsert to handle duplicates)
    await prisma.follow.upsert({
      where: {
        followerId_artistId: {
          followerId,
          artistId
        }
      },
      update: {},
      create: {
        followerId,
        artistId
      }
    })

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { artistId }
    })

    res.json({
      success: true,
      isFollowing: true,
      followerCount
    })
  } catch (error) {
    console.error('Follow error:', error)
    res.status(500).json({ error: 'Failed to follow artist' })
  }
})

// Unfollow an artist
router.delete('/:artistId', authenticateToken, async (req, res) => {
  try {
    const { artistId } = req.params
    const followerId = req.user.id

    await prisma.follow.deleteMany({
      where: {
        followerId,
        artistId
      }
    })

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { artistId }
    })

    res.json({
      success: true,
      isFollowing: false,
      followerCount
    })
  } catch (error) {
    console.error('Unfollow error:', error)
    res.status(500).json({ error: 'Failed to unfollow artist' })
  }
})

// Check if following an artist
router.get('/status/:artistId', authenticateToken, async (req, res) => {
  try {
    const { artistId } = req.params
    const followerId = req.user.id

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_artistId: {
          followerId,
          artistId
        }
      }
    })

    const followerCount = await prisma.follow.count({
      where: { artistId }
    })

    res.json({
      isFollowing: !!follow,
      followerCount
    })
  } catch (error) {
    console.error('Check follow status error:', error)
    res.status(500).json({ error: 'Failed to check follow status' })
  }
})

// Get follower count for an artist (public)
router.get('/count/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params

    const followerCount = await prisma.follow.count({
      where: { artistId }
    })

    res.json({ followerCount })
  } catch (error) {
    console.error('Get follower count error:', error)
    res.status(500).json({ error: 'Failed to get follower count' })
  }
})

// Get artists followed by current user
router.get('/following', authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id

    const follows = await prisma.follow.findMany({
      where: { followerId },
      orderBy: { createdAt: 'desc' }
    })

    // Get artist details
    const artistIds = follows.map(f => f.artistId)
    const artists = await prisma.user.findMany({
      where: { id: { in: artistIds } },
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        avatar: true,
        genres: true,
        popularity: true,
        followers: true
      }
    })

    res.json({ artists })
  } catch (error) {
    console.error('Get following error:', error)
    res.status(500).json({ error: 'Failed to get following list' })
  }
})

// Get followers of an artist
router.get('/followers/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params

    const follows = await prisma.follow.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to 100
    })

    const followerIds = follows.map(f => f.followerId)
    const followers = await prisma.user.findMany({
      where: { id: { in: followerIds } },
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        avatar: true
      }
    })

    res.json({
      followers,
      totalCount: await prisma.follow.count({ where: { artistId } })
    })
  } catch (error) {
    console.error('Get followers error:', error)
    res.status(500).json({ error: 'Failed to get followers' })
  }
})

module.exports = router
