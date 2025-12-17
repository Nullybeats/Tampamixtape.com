const NodeCache = require('node-cache');
const spotify = require('./spotify');
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

async function getAggregatedStats(artistName, spotifyId = null) {
  const cacheKey = `artist:${artistName.toLowerCase()}:${spotifyId || 'auto'}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  // Fetch from all platforms in parallel
  const [spotifyData, youtubeData, lastfmData] = await Promise.allSettled([
    spotifyId
      ? spotify.getArtistStats(spotifyId)
      : spotify.searchArtist(artistName).then(artists =>
          artists[0] ? spotify.getArtistStats(artists[0].id) : null
        ),
    youtube.getArtistYouTubeStats(artistName),
    lastfm.getArtistStats(artistName),
  ]);

  const spotifyStats = spotifyData.status === 'fulfilled' ? spotifyData.value : null;
  const youtubeStats = youtubeData.status === 'fulfilled' ? youtubeData.value : null;
  const lastfmStats = lastfmData.status === 'fulfilled' ? lastfmData.value : null;

  // Calculate totals
  const totalReach = {
    spotifyFollowers: spotifyStats?.followers || 0,
    youtubeSubscribers: youtubeStats?.subscribers || 0,
    youtubeViews: youtubeStats?.totalChannelViews || 0,
    lastfmListeners: lastfmStats?.listeners || 0,
    lastfmPlays: lastfmStats?.totalPlays || 0,
  };

  const grandTotal =
    totalReach.spotifyFollowers +
    totalReach.youtubeSubscribers +
    totalReach.youtubeViews +
    totalReach.lastfmListeners;

  const result = {
    artist: {
      name: spotifyStats?.name || lastfmStats?.name || artistName,
      image: spotifyStats?.image || lastfmStats?.image || youtubeStats?.topVideos?.[0]?.thumbnail,
      genres: spotifyStats?.genres || lastfmStats?.tags || [],
    },
    platforms: {
      spotify: spotifyStats ? {
        available: true,
        followers: spotifyStats.followers,
        followersFormatted: formatNumber(spotifyStats.followers),
        popularity: spotifyStats.popularity,
        topTracks: spotifyStats.topTracks,
        url: spotifyStats.url,
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
      followers: totalReach.spotifyFollowers + totalReach.youtubeSubscribers,
      followersFormatted: formatNumber(totalReach.spotifyFollowers + totalReach.youtubeSubscribers),
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
  // artists is an array of { name, spotifyId? }
  const results = await Promise.allSettled(
    artists.map(artist => getAggregatedStats(artist.name, artist.spotifyId))
  );

  return results.map((result, index) => ({
    query: artists[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason?.message : null,
  }));
}

async function searchArtists(query) {
  const [spotifyResults, lastfmResults] = await Promise.allSettled([
    spotify.searchArtist(query),
    lastfm.searchArtist(query),
  ]);

  const spotifyArtists = spotifyResults.status === 'fulfilled' ? spotifyResults.value : [];
  const lastfmArtists = lastfmResults.status === 'fulfilled' ? lastfmResults.value : [];

  // Merge and dedupe results
  const seen = new Set();
  const merged = [];

  for (const artist of spotifyArtists) {
    const key = artist.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({
        name: artist.name,
        spotifyId: artist.id,
        image: artist.images?.[0]?.url,
        followers: artist.followers?.total || 0,
        source: 'spotify',
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
