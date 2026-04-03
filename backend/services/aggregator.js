const NodeCache = require('node-cache');
const appleMusic = require('./applemusic');
const youtube = require('./youtube');
const lastfm = require('./lastfm');

// Cache results for 15 minutes
const cache = new NodeCache({ stdTTL: 900 });

function formatNumber(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

async function getAggregatedStats(artistName, appleMusicId = null) {
  const cacheKey = `artist:${artistName.toLowerCase()}:${appleMusicId || 'auto'}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  // Fetch from all platforms in parallel
  const [appleMusicData, youtubeData, lastfmData] = await Promise.allSettled([
    appleMusicId
      ? appleMusic.getArtistStats(appleMusicId)
      : appleMusic.searchArtist(artistName).then(artists =>
          artists[0] ? appleMusic.getArtistStats(artists[0].id) : null
        ),
    youtube.getArtistYouTubeStats(artistName),
    lastfm.getArtistStats(artistName),
  ]);

  const appleMusicStats = appleMusicData.status === 'fulfilled' ? appleMusicData.value : null;
  const youtubeStats = youtubeData.status === 'fulfilled' ? youtubeData.value : null;
  const lastfmStats = lastfmData.status === 'fulfilled' ? lastfmData.value : null;

  // Calculate totals
  const totalReach = {
    youtubeSubscribers: youtubeStats?.subscribers || 0,
    youtubeViews: youtubeStats?.totalChannelViews || 0,
    lastfmListeners: lastfmStats?.listeners || 0,
    lastfmPlays: lastfmStats?.totalPlays || 0,
  };

  const grandTotal =
    totalReach.youtubeSubscribers +
    totalReach.youtubeViews +
    totalReach.lastfmListeners;

  const result = {
    artist: {
      name: appleMusicStats?.name || lastfmStats?.name || artistName,
      image: appleMusicStats?.image || lastfmStats?.image || youtubeStats?.topVideos?.[0]?.thumbnail,
      genres: appleMusicStats?.genres || lastfmStats?.tags || [],
    },
    platforms: {
      appleMusic: appleMusicStats ? {
        available: true,
        genres: appleMusicStats.genres,
        totalAlbums: appleMusicStats.totalAlbums,
        url: appleMusicStats.url,
      } : { available: false },

      youtube: youtubeStats && !youtubeStats.error ? {
        available: true,
        subscribers: youtubeStats.subscribers,
        subscribersFormatted: formatNumber(youtubeStats.subscribers),
        totalViews: youtubeStats.totalChannelViews,
        totalViewsFormatted: formatNumber(youtubeStats.totalChannelViews),
        topVideos: youtubeStats.topVideos,
        url: youtubeStats.url,
      } : { available: false, reason: youtubeStats?.error || 'API key not configured' },

      lastfm: lastfmStats ? {
        available: true,
        listeners: lastfmStats.listeners,
        listenersFormatted: formatNumber(lastfmStats.listeners),
        totalPlays: lastfmStats.totalPlays,
        totalPlaysFormatted: formatNumber(lastfmStats.totalPlays),
        topTracks: lastfmStats.topTracks,
        url: lastfmStats.url,
      } : { available: false },
    },
    totals: {
      followers: totalReach.youtubeSubscribers,
      followersFormatted: formatNumber(totalReach.youtubeSubscribers),
      views: totalReach.youtubeViews,
      viewsFormatted: formatNumber(totalReach.youtubeViews),
      plays: totalReach.lastfmPlays,
      playsFormatted: formatNumber(totalReach.lastfmPlays),
      listeners: totalReach.lastfmListeners,
      listenersFormatted: formatNumber(totalReach.lastfmListeners),
      grandTotal,
      grandTotalFormatted: formatNumber(grandTotal),
    },
    fetchedAt: new Date().toISOString(),
    cached: false,
  };

  cache.set(cacheKey, result);
  return result;
}

async function getMultipleArtistsStats(artists) {
  // artists is an array of { name, appleMusicId? }
  const results = await Promise.allSettled(
    artists.map(artist => getAggregatedStats(artist.name, artist.appleMusicId))
  );

  return results.map((result, index) => ({
    query: artists[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason?.message : null,
  }));
}

async function searchArtists(query) {
  const [appleMusicResults, lastfmResults] = await Promise.allSettled([
    appleMusic.searchArtist(query),
    lastfm.searchArtist(query),
  ]);

  const appleMusicArtists = appleMusicResults.status === 'fulfilled' ? appleMusicResults.value : [];
  const lastfmArtists = lastfmResults.status === 'fulfilled' ? lastfmResults.value : [];

  // Merge and dedupe results
  const seen = new Set();
  const merged = [];

  for (const artist of appleMusicArtists) {
    const key = artist.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({
        name: artist.name,
        appleMusicId: artist.id,
        image: artist.artwork,
        source: 'apple_music',
      });
    }
  }

  for (const artist of lastfmArtists) {
    const key = artist.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({
        name: artist.name,
        image: artist.image?.find(img => img.size === 'large')?.['#text'],
        listeners: parseInt(artist.listeners || 0),
        source: 'lastfm',
      });
    }
  }

  return merged;
}

function clearCache() {
  cache.flushAll();
}

module.exports = {
  getAggregatedStats,
  getMultipleArtistsStats,
  searchArtists,
  clearCache,
};
