const express = require('express');
const cors = require('cors');
require('dotenv').config();

const artistsRouter = require('./routes/artists');
const releasesRouter = require('./routes/releases');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const spotifyRouter = require('./routes/spotify');
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
app.use(express.json());

// Health check route (tests real connectivity)
app.get('/api/health', async (req, res) => {
  const prisma = require('./services/db');
  const spotify = require('./services/spotify');

  const checks = {
    database: false,
    spotify: false,
  };

  try { await prisma.$queryRaw`SELECT 1`; checks.database = true; } catch {}
  try { await spotify.getAccessToken(); checks.spotify = true; } catch {}

  const healthy = checks.database && checks.spotify;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    message: 'TampaCharts API is running',
    version: '1.0.0',
    checks,
    apis: {
      spotify: !!process.env.SPOTIFY_CLIENT_ID,
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
app.use('/api/spotify', spotifyRouter);
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
  console.log(`   Spotify API: ${process.env.SPOTIFY_CLIENT_ID ? '✓' : '✗'}`);
  console.log(`   Ticketmaster API: ${process.env.TICKETMASTER_API_KEY ? '✓' : '✗'}`);
  console.log(`   Admin configured: ${process.env.ADMIN_EMAIL ? '✓' : '✗'}`);

  // Keep alive - ping every 14 min to prevent Render cold starts
  setInterval(() => {
    fetch(`http://localhost:${PORT}/api/health`).catch(() => {});
  }, 14 * 60 * 1000);

  // Start the auto-sync scheduler
  try {
    const scheduler = require('./services/scheduler');
    await scheduler.start();
  } catch (error) {
    console.error('Failed to start scheduler:', error.message);
  }
});
