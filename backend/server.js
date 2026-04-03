const express = require('express');
const cors = require('cors');
require('dotenv').config();

const artistsRouter = require('./routes/artists');
const releasesRouter = require('./routes/releases');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const musicRouter = require('./routes/music');
const profileRouter = require('./routes/profile');
const followRouter = require('./routes/follow');
const feedRouter = require('./routes/feed');
const claimsRouter = require('./routes/claims');
const contactRouter = require('./routes/contact');
const landingRouter = require('./routes/landing');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://tampamixtape.com',
  'https://www.tampamixtape.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow Vercel preview deployments
    if (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.sh'))) {
      return callback(null, true);
    }
    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check route
app.get('/api/health', async (req, res) => {
  const prisma = require('./services/db');
  const appleMusic = require('./services/applemusic');

  const checks = {
    database: false,
    appleMusic: false,
  };

  try { await prisma.$queryRaw`SELECT 1`; checks.database = true; } catch {}
  checks.appleMusic = appleMusic.hasValidToken();

  const healthy = checks.database;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    message: 'TampaCharts API is running',
    version: '2.0.0',
    checks,
    apis: {
      appleMusic: !!(process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID),
      youtube: !!process.env.YOUTUBE_API_KEY,
      lastfm: !!process.env.LASTFM_API_KEY,
      genius: !!process.env.GENIUS_ACCESS_TOKEN,
      ticketmaster: !!process.env.TICKETMASTER_API_KEY,
      database: !!process.env.DATABASE_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/artists', artistsRouter);
app.use('/api/releases', releasesRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/music', musicRouter);
app.use('/api/profile', profileRouter);
app.use('/api/follow', followRouter);
app.use('/api/feed', feedRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/contact', contactRouter);
app.use('/api', landingRouter);

// Legacy route for backwards compatibility
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from TampaCharts API!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`🎵 TampaCharts API running on port ${PORT}`);
  console.log(`   Database: ${process.env.DATABASE_URL ? '✓' : '✗'}`);
  console.log(`   Apple Music API: ${process.env.APPLE_TEAM_ID ? '✓' : '✗'}`);
  console.log(`   Ticketmaster: ${process.env.TICKETMASTER_API_KEY ? '✓' : '✗ (events disabled)'}`);
  console.log(`   Admin configured: ${process.env.ADMIN_EMAIL ? '✓' : '✗'}`);

  // Keep alive - ping every 14 min to prevent Render cold starts
  setInterval(() => {
    fetch(`http://localhost:${PORT}/api/health`).catch(() => {});
  }, 14 * 60 * 1000);

  // Run one-time Apple Music migration (maps Spotify IDs → Apple Music IDs)
  try {
    const prisma = require('./services/db');
    const appleMusic = require('./services/applemusic');

    const unmigrated = await prisma.user.count({
      where: { role: 'ARTIST', status: 'APPROVED', spotifyId: { not: null }, appleMusicId: null },
    });

    if (unmigrated > 0 && process.env.APPLE_TEAM_ID) {
      console.log(`[Migration] Found ${unmigrated} artists to migrate to Apple Music...`);
      const artists = await prisma.user.findMany({
        where: { role: 'ARTIST', status: 'APPROVED', spotifyId: { not: null }, appleMusicId: null },
        select: { id: true, artistName: true },
        orderBy: { artistName: 'asc' },
      });

      let matched = 0, failed = 0;
      for (const artist of artists) {
        if (!artist.artistName) continue;
        try {
          const results = await appleMusic.searchArtist(artist.artistName);
          await new Promise(r => setTimeout(r, 200));
          if (!results || results.length === 0) { failed++; continue; }

          const normalizedName = artist.artistName.toLowerCase().trim();
          const exactMatch = results.find(r => r.name.toLowerCase().trim() === normalizedName);
          const best = exactMatch || results[0];

          await prisma.user.update({
            where: { id: artist.id },
            data: { appleMusicId: best.id, appleMusicUrl: best.url, syncEnabled: true, syncFailCount: 0, lastSyncError: null },
          });
          console.log(`[Migration] ✅ ${artist.artistName} → ${best.name} (ID: ${best.id})`);
          matched++;
        } catch (err) {
          if (err.response?.status === 429) {
            const wait = parseInt(err.response?.headers?.['retry-after']) || 30;
            console.log(`[Migration] Rate limited, waiting ${wait}s...`);
            await new Promise(r => setTimeout(r, wait * 1000));
          }
          failed++;
        }
      }
      console.log(`[Migration] Complete: ${matched} matched, ${failed} failed`);
    }
  } catch (error) {
    console.error('[Migration] Error:', error.message);
  }

  // One-time genre sync from Apple Music (runs if artists have appleMusicId but no genres)
  try {
    const prisma = require('./services/db');
    const appleMusic = require('./services/applemusic');

    const needsGenres = await prisma.user.findMany({
      where: {
        role: 'ARTIST',
        status: 'APPROVED',
        appleMusicId: { not: null },
        genresLocked: false,
        OR: [{ genres: null }, { genres: '' }],
      },
      select: { id: true, artistName: true, appleMusicId: true },
    });

    if (needsGenres.length > 0 && process.env.APPLE_TEAM_ID) {
      console.log(`[GenreSync] Updating genres for ${needsGenres.length} artists from Apple Music...`);
      let updated = 0;
      for (const artist of needsGenres) {
        try {
          const data = await appleMusic.getArtist(artist.appleMusicId);
          await new Promise(r => setTimeout(r, 200));
          if (data?.genres?.length > 0) {
            const formatted = data.genres
              .slice(0, 3)
              .map(g => g.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '))
              .join(', ');
            await prisma.user.update({
              where: { id: artist.id },
              data: { genres: formatted },
            });
            console.log(`[GenreSync] ✅ ${artist.artistName} → ${formatted}`);
            updated++;
          }
        } catch (err) {
          if (err.response?.status === 429) {
            const wait = parseInt(err.response?.headers?.['retry-after']) || 30;
            console.log(`[GenreSync] Rate limited, waiting ${wait}s...`);
            await new Promise(r => setTimeout(r, wait * 1000));
          }
        }
      }
      console.log(`[GenreSync] Complete: ${updated}/${needsGenres.length} updated`);
    }
  } catch (error) {
    console.error('[GenreSync] Error:', error.message);
  }

  // Start the auto-sync scheduler
  try {
    const scheduler = require('./services/scheduler');
    await scheduler.start();
  } catch (error) {
    console.error('Failed to start scheduler:', error.message);
  }
});
