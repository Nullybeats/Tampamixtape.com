const axios = require('axios');

let accessToken = null;
let tokenExpiry = null;

/**
 * Extract Spotify artist ID from various URL formats
 * Supports:
 * - https://open.spotify.com/artist/ABC123
 * - https://open.spotify.com/artist/ABC123?si=xxx
 * - spotify:artist:ABC123
 * - ABC123 (raw ID)
 */
function extractArtistId(input) {
  if (!input) return null;

  const trimmed = input.trim();

  // Raw ID (22 character alphanumeric)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  // Spotify URI format: spotify:artist:ABC123
  const uriMatch = trimmed.match(/spotify:artist:([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return uriMatch[1];
  }

  // URL format: https://open.spotify.com/artist/ABC123
  const urlMatch = trimmed.match(/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  return null;
}

async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
    }
  );

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  return accessToken;
}

async function searchArtist(query) {
  const token = await getAccessToken();
  const response = await axios.get('https://api.spotify.com/v1/search', {
    headers: { Authorization: `Bearer ${token}` },
    params: { q: query, type: 'artist', limit: 5 },
  });
  return response.data.artists.items;
}

async function getArtist(artistId) {
  const token = await getAccessToken();
  const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

async function getArtistTopTracks(artistId, market = 'US') {
  const token = await getAccessToken();
  const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { market },
  });
  return response.data.tracks;
}

async function getArtistAlbums(artistId) {
  const token = await getAccessToken();
  const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { include_groups: 'album,single', limit: 50 },
  });
  return response.data.items;
}

async function getAlbumTracks(albumId) {
  const token = await getAccessToken();
  const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 50 },
  });
  return response.data.items;
}

async function getArtistStats(artistId) {
  try {
    const [artist, topTracks, albums] = await Promise.all([
      getArtist(artistId),
      getArtistTopTracks(artistId),
      getArtistAlbums(artistId),
    ]);

    return {
      platform: 'spotify',
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || null,
      followers: artist.followers?.total || 0,
      popularity: artist.popularity || 0, // 0-100 score
      genres: artist.genres || [],
      topTracks: topTracks.slice(0, 5).map(track => ({
        id: track.id,
        name: track.name,
        popularity: track.popularity,
        previewUrl: track.preview_url,
        albumImage: track.album?.images?.[0]?.url,
      })),
      totalAlbums: albums.length,
      url: artist.external_urls?.spotify,
    };
  } catch (error) {
    console.error('Spotify getArtistStats error:', error.message);
    throw error;
  }
}

async function getFullArtistData(artistId) {
  try {
    const [artist, topTracks, albums] = await Promise.all([
      getArtist(artistId),
      getArtistTopTracks(artistId),
      getArtistAlbums(artistId),
    ]);

    // Sort albums by release date (newest first)
    const sortedAlbums = albums.sort((a, b) =>
      new Date(b.release_date) - new Date(a.release_date)
    );

    return {
      platform: 'spotify',
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || null,
      followers: artist.followers?.total || 0,
      popularity: artist.popularity || 0,
      genres: artist.genres || [],
      url: artist.external_urls?.spotify,
      topTracks: topTracks.map(track => ({
        id: track.id,
        name: track.name,
        popularity: track.popularity,
        duration: track.duration_ms,
        previewUrl: track.preview_url,
        albumName: track.album?.name,
        albumImage: track.album?.images?.[0]?.url,
        url: track.external_urls?.spotify,
      })),
      latestReleases: sortedAlbums.slice(0, 6).map(album => ({
        id: album.id,
        name: album.name,
        type: album.album_type,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
        image: album.images?.[0]?.url,
        url: album.external_urls?.spotify,
      })),
      discography: {
        albums: sortedAlbums.filter(a => a.album_type === 'album').map(album => ({
          id: album.id,
          name: album.name,
          type: album.album_type,
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          image: album.images?.[0]?.url,
          url: album.external_urls?.spotify,
        })),
        singles: sortedAlbums.filter(a => a.album_type === 'single').map(album => ({
          id: album.id,
          name: album.name,
          type: album.album_type,
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          image: album.images?.[0]?.url,
          url: album.external_urls?.spotify,
        })),
        compilations: sortedAlbums.filter(a => a.album_type === 'compilation').map(album => ({
          id: album.id,
          name: album.name,
          type: album.album_type,
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          image: album.images?.[0]?.url,
          url: album.external_urls?.spotify,
        })),
      },
      totalAlbums: albums.filter(a => a.album_type === 'album').length,
      totalSingles: albums.filter(a => a.album_type === 'single').length,
    };
  } catch (error) {
    console.error('Spotify getFullArtistData error:', error.message);
    throw error;
  }
}

module.exports = {
  extractArtistId,
  searchArtist,
  getArtist,
  getArtistTopTracks,
  getArtistAlbums,
  getAlbumTracks,
  getArtistStats,
  getFullArtistData,
};
