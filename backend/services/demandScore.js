const prisma = require('./db');

// ==============================
// TampaMixtape Demand Score (0–100)
// ==============================
// "How much real, current attention is this artist getting
//  relative to other Tampa artists right now?"
//
// Score = Release Activity (35%) + Platform Signal (40%)
//       + Chart Presence (15%) + Live Presence (10%)

const WEIGHTS = {
  release: 0.35,
  platform: 0.40,
  chart: 0.15,
  live: 0.10,
};

// In-memory chart cache (refreshed daily)
let chartCache = { artists: new Map(), lastFetched: 0 };

function getTier(score) {
  if (score >= 85) return 'breakout';
  if (score >= 70) return 'trending';
  if (score >= 55) return 'radar';
  if (score >= 40) return 'building';
  return 'emerging';
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD string for releaseDate comparison
}

function dateAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ==============================
// Bucket 1: Release Activity (0–100)
// ==============================

async function calcReleaseScore(artistId) {
  const now30 = daysAgo(30);
  const now90 = daysAgo(90);

  const [last30, last90, total] = await Promise.all([
    prisma.release.count({ where: { artistId, releaseDate: { gte: now30 } } }),
    prisma.release.count({ where: { artistId, releaseDate: { gte: now90 } } }),
    prisma.release.count({ where: { artistId } }),
  ]);

  let score = 0;
  score += Math.min(last30 * 25, 50);     // Recent drops (capped 50)
  score += Math.min(last90 * 8, 30);      // Quarter activity (capped 30)
  score += Math.min(total * 1, 20);       // Catalog depth (capped 20)

  return Math.min(score, 100);
}

// ==============================
// Bucket 2: Platform Signal (0–100)
// ==============================

async function calcPlatformScore(artistId) {
  const thirtyDaysAgo = dateAgo(30);

  const [followers, recentFollows, views] = await Promise.all([
    prisma.follow.count({ where: { artistId } }),
    prisma.follow.count({ where: { artistId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.profileView.count({ where: { artistId, createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  let score = 0;
  score += Math.min(views * 0.7, 35);          // Views (capped 35)
  score += Math.min(followers * 5, 35);         // Total followers (capped 35)
  score += Math.min(recentFollows * 10, 30);    // Follower velocity (capped 30)

  return Math.min(score, 100);
}

// ==============================
// Bucket 3: Chart Presence (0–100)
// ==============================

async function fetchAndCacheCharts() {
  // Only refresh once per day
  const oneDay = 24 * 60 * 60 * 1000;
  if (Date.now() - chartCache.lastFetched < oneDay) return;

  try {
    const appleMusic = require('./applemusic');
    const data = await appleMusic.getDeveloperToken(); // Ensure token is valid

    const axios = require('axios');
    const storefront = process.env.APPLE_MUSIC_STOREFRONT || 'us';
    const response = await axios.get(
      `https://api.music.apple.com/v1/catalog/${storefront}/charts`,
      {
        headers: { Authorization: `Bearer ${appleMusic.getDeveloperToken()}` },
        params: { types: 'songs', limit: 200 },
      }
    );

    const songs = response.data?.results?.songs?.[0]?.data || [];

    // Get all our artists for cross-referencing
    const artists = await prisma.user.findMany({
      where: { status: 'APPROVED', role: 'ARTIST', appleMusicId: { not: null } },
      select: { id: true, artistName: true },
    });

    const artistMap = new Map();
    for (const artist of artists) {
      if (artist.artistName) {
        artistMap.set(artist.artistName.toLowerCase(), artist.id);
      }
    }

    // Cross-reference chart songs with our artists
    const matches = new Map();
    for (const song of songs) {
      const songArtist = song.attributes?.artistName?.toLowerCase();
      if (songArtist && artistMap.has(songArtist)) {
        const artistId = artistMap.get(songArtist);
        matches.set(artistId, (matches.get(artistId) || 0) + 1);
      }
    }

    chartCache = { artists: matches, lastFetched: Date.now() };
    if (matches.size > 0) {
      console.log(`[DemandScore] Chart cross-ref: ${matches.size} artists found on Apple Music charts`);
    }
  } catch (err) {
    console.error('[DemandScore] Chart fetch failed:', err.message);
    // Keep stale cache — don't clear on failure
  }
}

function calcChartScore(artistId) {
  const appearances = chartCache.artists.get(artistId) || 0;
  if (appearances === 0) return 0;
  return Math.min(appearances * 30 + 40, 100);
}

// ==============================
// Bucket 4: Live Presence (0–100)
// ==============================

async function calcLiveScore(artistName) {
  if (!artistName) return 0;

  try {
    const events = require('./events');
    const artistEvents = await events.getArtistEvents(artistName);
    const now = new Date();
    const upcomingCount = (artistEvents || []).filter(e =>
      new Date(e.date) >= now
    ).length;
    return Math.min(upcomingCount * 20, 100);
  } catch {
    return 0;
  }
}

// ==============================
// Main calculator
// ==============================

async function calculateDemandScore(artist) {
  const [releaseScore, platformScore, liveScore] = await Promise.all([
    calcReleaseScore(artist.id),
    calcPlatformScore(artist.id),
    calcLiveScore(artist.artistName),
  ]);

  const chartScore = calcChartScore(artist.id);

  const rawScore =
    releaseScore * WEIGHTS.release +
    platformScore * WEIGHTS.platform +
    chartScore * WEIGHTS.chart +
    liveScore * WEIGHTS.live;

  const score = Math.round(Math.min(rawScore, 100));
  const tier = getTier(score);

  return {
    score,
    tier,
    breakdown: {
      release: Math.round(releaseScore),
      platform: Math.round(platformScore),
      chart: Math.round(chartScore),
      live: Math.round(liveScore),
    },
  };
}

// ==============================
// Bulk recalculate all artists
// ==============================

async function recalculateAllScores() {
  console.log('[DemandScore] Recalculating all scores...');
  const startTime = Date.now();

  // Refresh chart cache first (once per day)
  await fetchAndCacheCharts();

  const artists = await prisma.user.findMany({
    where: { status: 'APPROVED', role: 'ARTIST' },
    select: { id: true, artistName: true },
  });

  let updated = 0;
  for (const artist of artists) {
    try {
      const { score, tier } = await calculateDemandScore(artist);

      await prisma.user.update({
        where: { id: artist.id },
        data: {
          demandScore: score,
          demandScoreTier: tier,
          demandScoreAt: new Date(),
        },
      });
      updated++;
    } catch (err) {
      console.error(`[DemandScore] Failed for ${artist.artistName}:`, err.message);
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`[DemandScore] Updated ${updated}/${artists.length} artists in ${duration}s`);
}

module.exports = {
  calculateDemandScore,
  recalculateAllScores,
  getTier,
};
