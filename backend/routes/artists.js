const express = require('express');
const router = express.Router();
const aggregator = require('../services/aggregator');
const spotify = require('../services/spotify');

// Search for artists across platforms
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await aggregator.searchArtists(q);
    res.json({ query: q, results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search artists' });
  }
});

// Get aggregated stats for a single artist
router.get('/stats/:artistName', async (req, res) => {
  try {
    const { artistName } = req.params;
    const { spotifyId } = req.query;

    const stats = await aggregator.getAggregatedStats(artistName, spotifyId);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch artist stats' });
  }
});

// Get stats for multiple artists at once
router.post('/stats/batch', async (req, res) => {
  try {
    const { artists } = req.body;
    if (!artists || !Array.isArray(artists)) {
      return res.status(400).json({ error: 'Request body must contain an "artists" array' });
    }

    if (artists.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 artists per request' });
    }

    const results = await aggregator.getMultipleArtistsStats(artists);
    res.json({
      total: artists.length,
      successful: results.filter(r => r.success).length,
      results,
    });
  } catch (error) {
    console.error('Batch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch batch stats' });
  }
});

// Get Spotify-specific data
router.get('/spotify/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    const stats = await spotify.getArtistStats(artistId);
    res.json(stats);
  } catch (error) {
    console.error('Spotify stats error:', error);
    res.status(500).json({ error: 'Failed to fetch Spotify stats' });
  }
});

// Get Spotify top tracks
router.get('/spotify/:artistId/tracks', async (req, res) => {
  try {
    const { artistId } = req.params;
    const tracks = await spotify.getArtistTopTracks(artistId);
    res.json({ tracks });
  } catch (error) {
    console.error('Spotify tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch Spotify tracks' });
  }
});

// Get full artist data (for artist page)
router.get('/spotify/:artistId/full', async (req, res) => {
  try {
    const { artistId } = req.params;
    const data = await spotify.getFullArtistData(artistId);
    res.json(data);
  } catch (error) {
    console.error('Full artist data error:', error);
    res.status(500).json({ error: 'Failed to fetch artist data' });
  }
});

// Get artist albums
router.get('/spotify/:artistId/albums', async (req, res) => {
  try {
    const { artistId } = req.params;
    const albums = await spotify.getArtistAlbums(artistId);
    res.json({
      albums: albums.map(album => ({
        id: album.id,
        name: album.name,
        type: album.album_type,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
        image: album.images?.[0]?.url,
        url: album.external_urls?.spotify,
      }))
    });
  } catch (error) {
    console.error('Spotify albums error:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Clear the cache (admin endpoint)
router.post('/cache/clear', (req, res) => {
  aggregator.clearCache();
  res.json({ message: 'Cache cleared' });
});

module.exports = router;
