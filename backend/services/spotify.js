const axios = require('axios');

let accessToken = null;
let tokenExpiry = null;
let rateLimitedUntil = 0; // Global cooldown — no requests until this timestamp

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

/**
 * Check if token is already cached (no network call).
 * Used by health check to avoid proactive Spotify API calls.
 */
function hasValidToken() {
  return !!(accessToken && tokenExpiry && Date.now() < tokenExpiry);
}

// ==============================
// Rate limit helpers
// ==============================

function isInCooldown() {
  if (Date.now() < rateLimitedUntil) {
    const remainingSec = Math.round((rateLimitedUntil - Date.now()) / 1000);
    return { cooldown: true, remainingSec };
  }
  return { cooldown: false, remainingSec: 0 };
}

/**
 * Returns true if the Spotify API is currently rate-limited.
 * Used by scheduler to abort sync cycles early.
 */
function isRateLimited() {
  return Date.now() < rateLimitedUntil;
}

// ==============================
// Centralized API wrapper — NO retries on 429
// ==============================

async function apiGet(url, params = {}) {
  // Check global cooldown before making any request
  const cooldown = isInCooldown();
  if (cooldown.cooldown) {
    const err = new Error(`Spotify API in cooldown for ${cooldown.remainingSec}s`);
    err.isRateLimitCooldown = true;
    throw err;
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getAccessToken();
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data;
    } catch (err) {
      const status = err.response?.status;

      // 403 Forbidden — log the URL so we can distinguish removed endpoints vs rate limit
      if (status === 403) {
        console.log(`[Spotify] 403 Forbidden for ${url} — possible removed endpoint or rate limit`);
        throw err;
      }

      // Rate limited (429) — set global cooldown and abort immediately, NO retries
      if (status === 429) {
        const rawRetry = parseInt(err.response?.headers?.['retry-after']) || 30;
        // Cap cooldown at 1 hour max
        const cooldownSec = Math.min(rawRetry, 3600);
        rateLimitedUntil = Date.now() + cooldownSec * 1000;
        console.log(`[Spotify] 429 Rate limited on ${url}. Retry-After: ${rawRetry}s. Entering cooldown for ${cooldownSec}s. No retries.`);
        const cooldownErr = new Error(`Spotify API rate limited for ${rawRetry}s — entering cooldown`);
        cooldownErr.isRateLimitCooldown = true;
        throw cooldownErr;
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
  throw new Error('Spotify API request failed after retries');
}

// ==============================
// Core API methods (all use apiGet)
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

/**
 * Safe wrapper around getArtist — returns null instead of throwing on 403/404.
 * Use this when you want to gracefully skip unavailable artists.
 */
async function getArtistSafe(artistId) {
  try {
    return await getArtist(artistId);
  } catch (err) {
    const status = err.response?.status;
    if (status === 403 || status === 404) {
      console.log(`[Spotify] getArtistSafe: ${status} for artist ${artistId}, returning null`);
      return null;
    }
    // Re-throw rate limit and other errors
    throw err;
  }
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
    const [artist, albums] = await Promise.all([
      getArtist(artistId),
      getArtistAlbums(artistId),
    ]);

    return {
      platform: 'spotify',
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || null,
      followers: artist.followers?.total || 0,
      genres: artist.genres || [],
      topTracks: [], // Top tracks endpoint removed in Dev Mode (Feb 2026)
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
    const [artist, albums] = await Promise.all([
      getArtist(artistId),
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
      genres: artist.genres || [],
      url: artist.external_urls?.spotify,
      topTracks: [], // Top tracks endpoint removed in Dev Mode (Feb 2026)
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
  isInCooldown,
  isRateLimited,
  hasValidToken,
  getAccessToken,
  searchArtist,
  getArtist,
  getArtistSafe,
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
