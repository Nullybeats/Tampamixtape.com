const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

let developerToken = null;
let tokenExpiry = null;

const STOREFRONT = process.env.APPLE_MUSIC_STOREFRONT || 'us';
const BASE_URL = `https://api.music.apple.com/v1/catalog/${STOREFRONT}`;

// ==============================
// Validation
// ==============================

function isValidAppleMusicId(id) {
  // Apple Music IDs are numeric strings (e.g., "1234567890")
  return typeof id === 'string' && /^\d+$/.test(id);
}

/**
 * Extract Apple Music artist ID from various URL formats
 * Supports:
 * - https://music.apple.com/us/artist/artist-name/1234567890
 * - https://music.apple.com/artist/artist-name/1234567890
 * - 1234567890 (raw numeric ID)
 */
function extractArtistId(input) {
  if (!input) return null;

  const trimmed = input.trim();

  // Raw numeric ID
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  // URL format: https://music.apple.com/.../artist/name/ID
  const urlMatch = trimmed.match(/music\.apple\.com\/(?:[a-z]{2}\/)?artist\/[^/]+\/(\d+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  return null;
}

// ==============================
// Token Management
// ==============================

function getDeveloperToken() {
  // Return cached token if still valid
  if (developerToken && tokenExpiry && Date.now() < tokenExpiry) {
    return developerToken;
  }

  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;

  if (!teamId || !keyId) {
    throw new Error('Apple Music credentials not configured (APPLE_TEAM_ID, APPLE_KEY_ID)');
  }

  // Load private key from file path or environment variable
  let privateKey;
  if (process.env.APPLE_MUSIC_PRIVATE_KEY) {
    privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY;
    // Handle escaped newlines from env vars
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
  } else if (process.env.APPLE_MUSIC_PRIVATE_KEY_PATH) {
    const keyPath = path.resolve(process.env.APPLE_MUSIC_PRIVATE_KEY_PATH);
    privateKey = fs.readFileSync(keyPath, 'utf8');
  } else {
    throw new Error('Apple Music private key not configured (APPLE_MUSIC_PRIVATE_KEY or APPLE_MUSIC_PRIVATE_KEY_PATH)');
  }

  // Generate JWT — valid for up to 180 days, we'll use 30 days
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 30 * 24 * 60 * 60; // 30 days in seconds

  developerToken = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn,
    issuer: teamId,
    header: {
      alg: 'ES256',
      kid: keyId,
    },
  });

  tokenExpiry = Date.now() + (expiresIn - 60) * 1000; // Refresh 60s before expiry
  return developerToken;
}

/**
 * Check if token is already cached (no computation needed).
 * Used by health check.
 */
function hasValidToken() {
  return !!(developerToken && tokenExpiry && Date.now() < tokenExpiry);
}

// ==============================
// Centralized API wrapper
// ==============================

async function apiGet(url, params = {}) {
  const token = getDeveloperToken();

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (err) {
    const status = err.response?.status;

    if (status === 401) {
      // Token expired — clear and retry once
      developerToken = null;
      tokenExpiry = null;
      const newToken = getDeveloperToken();
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${newToken}` },
        params,
      });
      return response.data;
    }

    if (status === 429) {
      const retryAfter = parseInt(err.response?.headers?.['retry-after']) || 30;
      console.log(`[AppleMusic] 429 Rate limited. Retry-After: ${retryAfter}s`);
      const rateLimitErr = new Error(`Apple Music API rate limited for ${retryAfter}s`);
      rateLimitErr.isRateLimitCooldown = true;
      rateLimitErr.retryAfter = retryAfter;
      throw rateLimitErr;
    }

    if (status === 404) {
      console.log(`[AppleMusic] 404 Not found: ${url}`);
    }

    throw err;
  }
}

// ==============================
// Core API methods
// ==============================

async function searchArtist(query) {
  const data = await apiGet(`${BASE_URL}/search`, {
    term: query,
    types: 'artists',
    limit: 5,
  });

  const artists = data.results?.artists?.data || [];
  return artists.map(artist => ({
    id: artist.id,
    name: artist.attributes.name,
    url: artist.attributes.url,
    genres: artist.attributes.genreNames || [],
    artwork: formatArtworkUrl(artist.attributes.artwork, 640),
  }));
}

async function getArtist(artistId) {
  const data = await apiGet(`${BASE_URL}/artists/${artistId}`);
  const artist = data.data?.[0];
  if (!artist) return null;

  return {
    id: artist.id,
    name: artist.attributes.name,
    url: artist.attributes.url,
    genres: artist.attributes.genreNames || [],
    artwork: formatArtworkUrl(artist.attributes.artwork, 640),
  };
}

/**
 * Safe wrapper — returns null instead of throwing on 404.
 */
async function getArtistSafe(artistId) {
  try {
    return await getArtist(artistId);
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) {
      console.log(`[AppleMusic] getArtistSafe: 404 for artist ${artistId}, returning null`);
      return null;
    }
    throw err;
  }
}

async function getArtistAlbums(artistId) {
  const allItems = [];
  let offset = 0;
  const limit = 25;

  while (true) {
    const data = await apiGet(`${BASE_URL}/artists/${artistId}/albums`, {
      limit,
      offset,
    });

    const albums = data.data || [];
    allItems.push(...albums);

    // Stop if no more results or hit cap
    if (!data.next || allItems.length >= 100) break;
    offset += limit;
  }

  return allItems.map(album => ({
    id: album.id,
    name: album.attributes.name,
    type: album.attributes.isSingle ? 'single' : 'album',
    releaseDate: album.attributes.releaseDate,
    trackCount: album.attributes.trackCount,
    image: formatArtworkUrl(album.attributes.artwork, 640),
    url: album.attributes.url,
    genres: album.attributes.genreNames || [],
    recordLabel: album.attributes.recordLabel || null,
    contentRating: album.attributes.contentRating || null,
    audioVariants: album.attributes.audioTraits || [],
    editorialNotes: album.attributes.editorialNotes?.short || null,
  }));
}

async function getAlbumTracks(albumId) {
  const data = await apiGet(`${BASE_URL}/albums/${albumId}/tracks`, {
    limit: 50,
  });

  return (data.data || []).map(track => ({
    id: track.id,
    name: track.attributes.name,
    trackNumber: track.attributes.trackNumber,
    discNumber: track.attributes.discNumber,
    durationMs: track.attributes.durationInMillis,
    previewUrl: track.attributes.previews?.[0]?.url || null,
    url: track.attributes.url,
    isrc: track.attributes.isrc || null,
  }));
}

async function getArtistStats(artistId) {
  try {
    const [artist, albums] = await Promise.all([
      getArtist(artistId),
      getArtistAlbums(artistId),
    ]);

    if (!artist) return null;

    return {
      platform: 'apple_music',
      id: artist.id,
      name: artist.name,
      image: artist.artwork,
      genres: artist.genres,
      totalAlbums: albums.length,
      url: artist.url,
    };
  } catch (error) {
    console.error('Apple Music getArtistStats error:', error.message);
    throw error;
  }
}

async function getFullArtistData(artistId) {
  try {
    const [artist, albums] = await Promise.all([
      getArtist(artistId),
      getArtistAlbums(artistId),
    ]);

    if (!artist) return null;

    // Sort albums by release date (newest first)
    const sortedAlbums = albums.sort((a, b) =>
      new Date(b.releaseDate) - new Date(a.releaseDate)
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    const pastAlbums = sortedAlbums.filter(a => !a.releaseDate || a.releaseDate <= todayStr);
    const upcomingAlbums = sortedAlbums
      .filter(a => a.releaseDate && a.releaseDate > todayStr)
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

    const toReleaseCard = (album) => ({
      id: album.id,
      name: album.name,
      type: album.type,
      releaseDate: album.releaseDate,
      totalTracks: album.trackCount,
      image: album.image,
      url: album.url,
    });

    return {
      platform: 'apple_music',
      id: artist.id,
      name: artist.name,
      image: artist.artwork,
      genres: artist.genres,
      url: artist.url,
      latestReleases: pastAlbums.slice(0, 6).map(toReleaseCard),
      upcomingReleases: upcomingAlbums.map(toReleaseCard),
      discography: {
        albums: sortedAlbums.filter(a => a.type === 'album').map(album => ({
          id: album.id,
          name: album.name,
          type: album.type,
          releaseDate: album.releaseDate,
          totalTracks: album.trackCount,
          image: album.image,
          url: album.url,
        })),
        singles: sortedAlbums.filter(a => a.type === 'single').map(album => ({
          id: album.id,
          name: album.name,
          type: album.type,
          releaseDate: album.releaseDate,
          totalTracks: album.trackCount,
          image: album.image,
          url: album.url,
        })),
      },
      totalAlbums: sortedAlbums.filter(a => a.type === 'album').length,
      totalSingles: sortedAlbums.filter(a => a.type === 'single').length,
      totalTracks: sortedAlbums.reduce((sum, a) => sum + (a.trackCount || 0), 0),
    };
  } catch (error) {
    console.error('Apple Music getFullArtistData error:', error.message);
    throw error;
  }
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

// ==============================
// Enriched data (for profile caching)
// ==============================

/**
 * Fetch artist with views (top songs, similar artists, playlists) in one call.
 */
async function getArtistWithViews(artistId) {
  const data = await apiGet(`${BASE_URL}/artists/${artistId}`, {
    views: 'top-songs,similar-artists,featured-playlists',
    extend: 'editorialNotes',
  });
  const artist = data.data?.[0];
  if (!artist) return null;

  const attrs = artist.attributes;
  const views = artist.views || {};

  // Parse top songs
  const topSongs = (views['top-songs']?.data || []).slice(0, 20).map((song, i) => ({
    id: song.id,
    name: song.attributes.name,
    albumName: song.attributes.albumName || '',
    albumImage: formatArtworkUrl(song.attributes.artwork, 300),
    durationMs: song.attributes.durationInMillis,
    previewUrl: song.attributes.previews?.[0]?.url || null,
    url: song.attributes.url,
    contentRating: song.attributes.contentRating || null,
    isrc: song.attributes.isrc || null,
    popularity: 100 - (i * 5), // Position-based proxy score
  }));

  // Parse similar artists
  const similarArtists = (views['similar-artists']?.data || []).slice(0, 12).map(a => ({
    id: a.id,
    name: a.attributes.name,
    artwork: formatArtworkUrl(a.attributes.artwork, 300),
    url: a.attributes.url,
    genres: a.attributes.genreNames || [],
  }));

  // Parse featured playlists
  const featuredPlaylists = (views['featured-playlists']?.data || []).slice(0, 8).map(p => ({
    id: p.id,
    name: p.attributes.name,
    artwork: formatArtworkUrl(p.attributes.artwork, 300),
    url: p.attributes.url,
    description: p.attributes.description?.standard || p.attributes.editorialNotes?.short || null,
  }));

  return {
    id: artist.id,
    name: attrs.name,
    url: attrs.url,
    genres: attrs.genreNames || [],
    artwork: {
      url: formatArtworkUrl(attrs.artwork, 640),
      bgColor: attrs.artwork?.bgColor || null,
      textColor1: attrs.artwork?.textColor1 || null,
      textColor2: attrs.artwork?.textColor2 || null,
      textColor3: attrs.artwork?.textColor3 || null,
      textColor4: attrs.artwork?.textColor4 || null,
    },
    editorialNotes: {
      standard: attrs.editorialNotes?.standard || null,
      short: attrs.editorialNotes?.short || null,
    },
    topSongs,
    similarArtists,
    featuredPlaylists,
  };
}

/**
 * Fetch music videos for an artist.
 */
async function getArtistMusicVideos(artistId) {
  try {
    const data = await apiGet(`${BASE_URL}/artists/${artistId}/music-videos`, {
      limit: 10,
    });
    return (data.data || []).map(mv => ({
      id: mv.id,
      name: mv.attributes.name,
      artwork: formatArtworkUrl(mv.attributes.artwork, 640),
      url: mv.attributes.url,
      durationMs: mv.attributes.durationInMillis,
      previewUrl: mv.attributes.previews?.[0]?.url || null,
      releaseDate: mv.attributes.releaseDate || null,
      contentRating: mv.attributes.contentRating || null,
    }));
  } catch (err) {
    // Some artists have no music videos — return empty
    if (err.response?.status === 404) return [];
    throw err;
  }
}

/**
 * Full enriched data for caching — combines views, albums, and music videos.
 * Makes 3 API calls in parallel.
 */
async function getFullEnrichedData(artistId) {
  const [artistViews, albums, musicVideos] = await Promise.all([
    getArtistWithViews(artistId),
    getArtistAlbums(artistId),
    getArtistMusicVideos(artistId).catch(() => []),
  ]);

  if (!artistViews) return null;

  const sortedAlbums = albums.sort((a, b) =>
    new Date(b.releaseDate) - new Date(a.releaseDate)
  );

  // Normalize each release so frontend always sees totalTracks
  const normalizeRelease = (album) => ({
    ...album,
    totalTracks: album.trackCount || album.totalTracks || 0,
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const pastAlbums = sortedAlbums.filter(a => !a.releaseDate || a.releaseDate <= todayStr);
  const upcomingAlbums = sortedAlbums
    .filter(a => a.releaseDate && a.releaseDate > todayStr)
    .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

  return {
    ...artistViews,
    topTracks: artistViews.topSongs, // Alias for frontend compatibility
    musicVideos,
    discography: {
      albums: sortedAlbums.filter(a => a.type === 'album').map(normalizeRelease),
      singles: sortedAlbums.filter(a => a.type === 'single').map(normalizeRelease),
    },
    latestReleases: pastAlbums.slice(0, 6).map(normalizeRelease),
    upcomingReleases: upcomingAlbums.map(normalizeRelease),
    totalAlbums: sortedAlbums.filter(a => a.type === 'album').length,
    totalSingles: sortedAlbums.filter(a => a.type === 'single').length,
    totalTracks: sortedAlbums.reduce((sum, a) => sum + (a.trackCount || 0), 0),
    lastEnrichedAt: new Date().toISOString(),
  };
}

// ==============================
// Helpers
// ==============================

/**
 * Convert Apple Music artwork URL template to a usable URL.
 * Apple provides URLs like: {url}?w={w}&h={h}
 * or with {w}x{h} placeholders in the path.
 */
function formatArtworkUrl(artwork, size = 640) {
  if (!artwork || !artwork.url) return null;

  return artwork.url
    .replace('{w}', size)
    .replace('{h}', size);
}

module.exports = {
  isValidAppleMusicId,
  extractArtistId,
  hasValidToken,
  getDeveloperToken,
  searchArtist,
  getArtist,
  getArtistSafe,
  getArtistAlbums,
  getAlbumTracks,
  getArtistStats,
  getFullArtistData,
  getFullEnrichedData,
  getArtistWithViews,
  getArtistMusicVideos,
  findArtistByName,
  formatArtworkUrl,
};
