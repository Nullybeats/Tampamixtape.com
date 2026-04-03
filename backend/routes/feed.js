const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')

const prisma = new PrismaClient()

// Get personalized feed for authenticated user
// Returns user's own releases + releases from artists they follow
router.get('/personal', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const filter = req.query.filter || 'all' // all, releases, photos
    const skip = (page - 1) * limit

    // Get list of artists the user follows
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { artistId: true }
    })
    const followedArtistIds = follows.map(f => f.artistId)

    // Include the user's own ID to get their releases too
    const artistIds = [...followedArtistIds, userId]

    // Get releases from followed artists + own releases
    const releases = await prisma.release.findMany({
      where: {
        artistId: { in: artistIds }
      },
      orderBy: { releaseDate: 'desc' },
      take: limit,
      skip: skip
    })

    // Get total count for pagination
    const totalReleases = await prisma.release.count({
      where: {
        artistId: { in: artistIds }
      }
    })

    // Get artist details for each release
    const uniqueArtistIds = [...new Set(releases.map(r => r.artistId))]
    const artists = await prisma.user.findMany({
      where: { id: { in: uniqueArtistIds } },
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        avatar: true
      }
    })

    const artistMap = artists.reduce((acc, artist) => {
      acc[artist.id] = artist
      return acc
    }, {})

    // Transform releases into feed items
    const items = releases.map(release => {
      const artist = artistMap[release.artistId] || {}
      return {
        id: release.id,
        type: 'release',
        artistId: release.artistId,
        artistName: artist.artistName || release.artistName,
        artistSlug: artist.profileSlug || release.artistSlug,
        artistAvatar: artist.avatar,
        message: `dropped "${release.name}"`,
        timestamp: release.releaseDate || release.createdAt,
        image: release.image,
        releaseData: {
          name: release.name,
          type: release.type,
          appleMusicUrl: release.appleMusicUrl
        },
        isOwnActivity: release.artistId === userId
      }
    })

    res.json({
      items,
      pagination: {
        page,
        limit,
        total: totalReleases,
        hasMore: skip + releases.length < totalReleases
      }
    })
  } catch (error) {
    console.error('Get personalized feed error:', error)
    res.status(500).json({ error: 'Failed to get personalized feed' })
  }
})

// Get user's own releases/activity
router.get('/my-activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const limit = parseInt(req.query.limit) || 10

    const releases = await prisma.release.findMany({
      where: { artistId: userId },
      orderBy: { releaseDate: 'desc' },
      take: limit
    })

    const items = releases.map(release => ({
      id: release.id,
      type: 'release',
      name: release.name,
      releaseType: release.type,
      image: release.image,
      timestamp: release.releaseDate || release.createdAt,
      appleMusicUrl: release.appleMusicUrl
    }))

    res.json({ items })
  } catch (error) {
    console.error('Get my activity error:', error)
    res.status(500).json({ error: 'Failed to get activity' })
  }
})

// Get activity from artists the user follows
router.get('/following-activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const limit = parseInt(req.query.limit) || 20

    // Get followed artist IDs
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { artistId: true }
    })
    const followedArtistIds = follows.map(f => f.artistId)

    if (followedArtistIds.length === 0) {
      return res.json({ items: [], message: 'Follow some artists to see their activity' })
    }

    // Get recent releases from followed artists
    const releases = await prisma.release.findMany({
      where: {
        artistId: { in: followedArtistIds }
      },
      orderBy: { releaseDate: 'desc' },
      take: limit
    })

    // Get artist details
    const uniqueArtistIds = [...new Set(releases.map(r => r.artistId))]
    const artists = await prisma.user.findMany({
      where: { id: { in: uniqueArtistIds } },
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        avatar: true
      }
    })

    const artistMap = artists.reduce((acc, artist) => {
      acc[artist.id] = artist
      return acc
    }, {})

    const items = releases.map(release => {
      const artist = artistMap[release.artistId] || {}
      return {
        id: release.id,
        type: 'release',
        artistId: release.artistId,
        artistName: artist.artistName || release.artistName,
        artistSlug: artist.profileSlug || release.artistSlug,
        artistAvatar: artist.avatar,
        message: `dropped "${release.name}"`,
        timestamp: release.releaseDate || release.createdAt,
        image: release.image,
        releaseData: {
          name: release.name,
          type: release.type,
          appleMusicUrl: release.appleMusicUrl
        }
      }
    })

    res.json({ items })
  } catch (error) {
    console.error('Get following activity error:', error)
    res.status(500).json({ error: 'Failed to get following activity' })
  }
})

module.exports = router
