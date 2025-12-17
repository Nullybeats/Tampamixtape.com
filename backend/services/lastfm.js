const axios = require('axios');

const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

async function makeRequest(method, params = {}) {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    console.warn('Last.fm API key not configured');
    return null;
  }

  try {
    const response = await axios.get(LASTFM_API_BASE, {
      params: {
        method,
        api_key: apiKey,
        format: 'json',
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Last.fm API error:', error.message);
    return null;
  }
}

async function searchArtist(query) {
  const data = await makeRequest('artist.search', { artist: query, limit: 5 });
  return data?.results?.artistmatches?.artist || [];
}

async function getArtistInfo(artistName) {
  const data = await makeRequest('artist.getinfo', { artist: artistName });
  return data?.artist || null;
}

async function getArtistTopTracks(artistName, limit = 10) {
  const data = await makeRequest('artist.gettoptracks', { artist: artistName, limit });
  return data?.toptracks?.track || [];
}

async function getArtistTopAlbums(artistName, limit = 10) {
  const data = await makeRequest('artist.gettopalbums', { artist: artistName, limit });
  return data?.topalbums?.album || [];
}

async function getTrackInfo(artistName, trackName) {
  const data = await makeRequest('track.getinfo', { artist: artistName, track: trackName });
  return data?.track || null;
}

async function getArtistStats(artistName) {
  try {
    const [artistInfo, topTracks, topAlbums] = await Promise.all([
      getArtistInfo(artistName),
      getArtistTopTracks(artistName, 10),
      getArtistTopAlbums(artistName, 5),
    ]);

    if (!artistInfo) {
      return null;
    }

    // Calculate total plays from top tracks
    const totalPlays = topTracks.reduce((sum, track) => {
      return sum + parseInt(track.playcount || 0);
    }, 0);

    return {
      platform: 'lastfm',
      name: artistInfo.name,
      mbid: artistInfo.mbid || null,
      image: artistInfo.image?.find(img => img.size === 'extralarge')?.['#text'] || null,
      listeners: parseInt(artistInfo.stats?.listeners || 0),
      totalPlays: parseInt(artistInfo.stats?.playcount || 0),
      topTracksPlays: totalPlays,
      bio: artistInfo.bio?.summary?.replace(/<[^>]*>/g, '') || null,
      tags: artistInfo.tags?.tag?.map(t => t.name) || [],
      topTracks: topTracks.slice(0, 5).map(track => ({
        name: track.name,
        playcount: parseInt(track.playcount || 0),
        listeners: parseInt(track.listeners || 0),
        url: track.url,
      })),
      topAlbums: topAlbums.slice(0, 3).map(album => ({
        name: album.name,
        playcount: parseInt(album.playcount || 0),
        image: album.image?.find(img => img.size === 'large')?.['#text'] || null,
      })),
      url: artistInfo.url,
    };
  } catch (error) {
    console.error('Last.fm getArtistStats error:', error.message);
    return null;
  }
}

module.exports = {
  searchArtist,
  getArtistInfo,
  getArtistTopTracks,
  getArtistTopAlbums,
  getTrackInfo,
  getArtistStats,
};
