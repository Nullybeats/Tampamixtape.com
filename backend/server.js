const express = require('express');
const cors = require('cors');
require('dotenv').config();

const artistsRouter = require('./routes/artists');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TampaCharts API is running',
    version: '1.0.0',
    apis: {
      spotify: !!process.env.SPOTIFY_CLIENT_ID,
      youtube: !!process.env.YOUTUBE_API_KEY,
      lastfm: !!process.env.LASTFM_API_KEY,
      genius: !!process.env.GENIUS_ACCESS_TOKEN,
      database: !!process.env.DATABASE_URL,
    },
  });
});

// API Routes
app.use('/api/artists', artistsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Legacy route for backwards compatibility
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from TampaCharts API!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🎵 TampaCharts API running on port ${PORT}`);
  console.log(`   Database: ${process.env.DATABASE_URL ? '✓' : '✗'}`);
  console.log(`   Spotify API: ${process.env.SPOTIFY_CLIENT_ID ? '✓' : '✗'}`);
  console.log(`   Admin configured: ${process.env.ADMIN_EMAIL ? '✓' : '✗'}`);
});
