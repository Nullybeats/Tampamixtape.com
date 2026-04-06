const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')

const prisma = new PrismaClient()

// Like an artist
router.post('/:artistId', authenticateToken, async (req, res) => {
  try {
    const { artistId } = req.params
    const userId = req.user.id

    // Can't like yourself
    if (artistId === userId) {
      return res.status(400).json({ error: 'Cannot like yourself' })
    }

    // Check if artist exists
    const artist = await prisma.user.findUnique({
      where: { id: artistId }
    })

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' })
    }

    // Create like (upsert to handle duplicates)
    await prisma.like.upsert({
      where: {
        userId_artistId: {
          userId,
          artistId
        }
      },
      update: {},
      create: {
        userId,
        artistId
      }
    })

    // Get updated like count and cache it
    const likeCount = await prisma.like.count({
      where: { artistId }
    })

    await prisma.user.update({
      where: { id: artistId },
      data: { likes: likeCount }
    })

    res.json({
      success: true,
      isLiked: true,
      likeCount
    })
  } catch (error) {
    console.error('Like error:', error)
    res.status(500).json({ error: 'Failed to like artist' })
  }
})

// Unlike an artist
router.delete('/:artistId', authenticateToken, async (req, res) => {
  try {
    const { artistId } = req.params
    const userId = req.user.id

    await prisma.like.deleteMany({
      where: {
        userId,
        artistId
      }
    })

    // Get updated like count and cache it
    const likeCount = await prisma.like.count({
      where: { artistId }
    })

    await prisma.user.update({
      where: { id: artistId },
      data: { likes: likeCount }
    })

    res.json({
      success: true,
      isLiked: false,
      likeCount
    })
  } catch (error) {
    console.error('Unlike error:', error)
    res.status(500).json({ error: 'Failed to unlike artist' })
  }
})

// Check if user liked an artist
router.get('/status/:artistId', authenticateToken, async (req, res) => {
  try {
    const { artistId } = req.params
    const userId = req.user.id

    const like = await prisma.like.findUnique({
      where: {
        userId_artistId: {
          userId,
          artistId
        }
      }
    })

    const likeCount = await prisma.like.count({
      where: { artistId }
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

// Get like count for an artist (public)
router.get('/count/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params

    const likeCount = await prisma.like.count({
      where: { artistId }
    })

    res.json({ likeCount })
  } catch (error) {
    console.error('Get like count error:', error)
    res.status(500).json({ error: 'Failed to get like count' })
  }
})

// Get artists liked by current user
router.get('/liked', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const likes = await prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // Get artist details
    const artistIds = likes.map(l => l.artistId)
    const artists = await prisma.user.findMany({
      where: { id: { in: artistIds } },
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        avatar: true,
        genres: true,
        popularity: true,
        followers: true,
        likes: true
      }
    })

    res.json({ artists })
  } catch (error) {
    console.error('Get liked artists error:', error)
    res.status(500).json({ error: 'Failed to get liked artists' })
  }
})

module.exports = router
