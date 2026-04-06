const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')

const prisma = new PrismaClient()

// Like a track
router.post('/:trackId', authenticateToken, async (req, res) => {
  try {
    const { trackId } = req.params
    const userId = req.user.id
    const { trackName, artistName, albumImage, trackUrl } = req.body

    if (!trackName || !artistName) {
      return res.status(400).json({ error: 'trackName and artistName are required' })
    }

    // Create like (upsert to handle duplicates)
    await prisma.like.upsert({
      where: {
        userId_trackId: {
          userId,
          trackId
        }
      },
      update: {},
      create: {
        userId,
        trackId,
        trackName,
        artistName,
        albumImage: albumImage || null,
        trackUrl: trackUrl || null
      }
    })

    // Get total like count for this track
    const likeCount = await prisma.like.count({
      where: { trackId }
    })

    res.json({
      success: true,
      isLiked: true,
      likeCount
    })
  } catch (error) {
    console.error('Like error:', error)
    res.status(500).json({ error: 'Failed to like track' })
  }
})

// Unlike a track
router.delete('/:trackId', authenticateToken, async (req, res) => {
  try {
    const { trackId } = req.params
    const userId = req.user.id

    await prisma.like.deleteMany({
      where: {
        userId,
        trackId
      }
    })

    const likeCount = await prisma.like.count({
      where: { trackId }
    })

    res.json({
      success: true,
      isLiked: false,
      likeCount
    })
  } catch (error) {
    console.error('Unlike error:', error)
    res.status(500).json({ error: 'Failed to unlike track' })
  }
})

// Check if user liked a track
router.get('/status/:trackId', authenticateToken, async (req, res) => {
  try {
    const { trackId } = req.params
    const userId = req.user.id

    const like = await prisma.like.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId
        }
      }
    })

    const likeCount = await prisma.like.count({
      where: { trackId }
    })

    res.json({
      isLiked: !!like,
      likeCount
    })
  } catch (error) {
    console.error('Check like status error:', error)
    res.status(500).json({ error: 'Failed to check like status' })
  }
})

// Get like count for a track (public)
router.get('/count/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params

    const likeCount = await prisma.like.count({
      where: { trackId }
    })

    res.json({ likeCount })
  } catch (error) {
    console.error('Get like count error:', error)
    res.status(500).json({ error: 'Failed to get like count' })
  }
})

// Get tracks liked by current user
router.get('/liked', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const likes = await prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        trackId: true,
        trackName: true,
        artistName: true,
        albumImage: true,
        trackUrl: true,
        createdAt: true
      }
    })

    res.json({ tracks: likes })
  } catch (error) {
    console.error('Get liked tracks error:', error)
    res.status(500).json({ error: 'Failed to get liked tracks' })
  }
})

module.exports = router
