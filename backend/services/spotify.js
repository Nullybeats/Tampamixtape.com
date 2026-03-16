const axios = require('axios');

let accessToken = null;
let tokenExpiry = null;

// ==============================
// Validation
// ==============================

function isValidSpotifyId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9]{22}$/.test(id);
}

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

// ==============================
// Token Management
// ==============================

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

// ==============================
// Centralized API wrapper with retry/backoff
// ==============================

async function apiGet(url, params = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = await getAccessToken();
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data;
    } catch (err) {
      const status = err.response?.status;

      // Rate limited — wait and retry (cap at 60s to avoid absurd Retry-After values)
      if (status === 429) {
        const rawRetry = parseInt(err.response?.headers?.['retry-after']) || 0;
        const retryAfter = Math.min(Math.max(rawRetry, 2 ** attempt * 2), 60);
        console.log(`[Spotify] Rate limited, waiting ${retryAfter}s (attempt ${attempt + 1}/3)${rawRetry > 60 ? ` (capped from ${rawRetry}s)` : ''}`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }

      // Token expired mid-request — clear cache and retry once
      if (status === 401 && attempt === 0) {
        accessToken = null;
        tokenExpiry = null;
        continue;
      }

      // Non-retryable error
      throw err;
    }
  }
  throw new Error('Spotify API request failed after 3 retries');
}

// ==============================
// Core API methods (all use apiGet for retry/backoff)
// ==============================

async function searchArtist(query) {
  const data = await apiGet('https://api.spotify.com/v1/search', {
    q: query, type: 'artist', limit: 5,
  });
  return data.artists.items;
}

async function getArtist(artistId) {
  return await apiGet(`https://api.spotify.com/v1/artists/${artistId}`);
}

async function getArtistsBatch(artistIds) {
  const results = [];
  for (let i = 0; i < artistIds.length; i += 50) {
    const chunk = artistIds.slice(i, i + 50);
    const data = await apiGet('https://api.spotify.com/v1/artists', {
      ids: chunk.join(','),
    });
    results.push(...(data.artists || []));
  }
  return results;
}

async function getArtistTopTracks(artistId, market = 'US') {
  const data = await apiGet(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
    market,
  });
  return data.tracks;
}

async function getArtistAlbums(artistId) {
  const data = await apiGet(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
    include_groups: 'album,single', limit: 50,
  });
  return data.items;
}

async function getAlbumTracks(albumId) {
  const data = await apiGet(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
    limit: 50,
  });
  return data.items;
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
      popularity: artist.popularity || 0,
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

// ===========================================
// OAuth Authorization Code Flow Functions
// ===========================================

const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
].join(' ');

function getAuthorizationUrl(state, redirectUri) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    throw new Error('SPOTIFY_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    state: state,
    show_dialog: 'true',
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code, redirectUri) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
    }
  );

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in,
  };
}

async function getSpotifyUserProfile(userAccessToken) {
  const response = await axios.get('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${userAccessToken}` },
  });

  return {
    id: response.data.id,
    displayName: response.data.display_name,
    email: response.data.email,
    images: response.data.images || [],
    country: response.data.country,
    product: response.data.product,
    uri: response.data.uri,
    externalUrls: response.data.external_urls,
  };
}

async function findArtistByName(name) {
  if (!name) return null;

  try {
    const artists = await searchArtist(name);
    if (!artists || artists.length === 0) return null;

    const normalizedName = name.toLowerCase().trim();
    const match = artists.find(
      artist => artist.name.toLowerCase().trim() === normalizedName
    );

    if (match) {
      return await getFullArtistData(match.id);
    }

    return await getFullArtistData(artists[0].id);
  } catch (error) {
    console.error('Error finding artist by name:', error.message);
    return null;
  }
}

module.exports = {
  isValidSpotifyId,
  extractArtistId,
  getAccessToken,
  searchArtist,
  getArtist,
  getArtistsBatch,
  getArtistTopTracks,
  getArtistAlbums,
  getAlbumTracks,
  getArtistStats,
  getFullArtistData,
  // OAuth functions
  getAuthorizationUrl,
  exchangeCodeForToken,
  getSpotifyUserProfile,
  findArtistByName,
};
