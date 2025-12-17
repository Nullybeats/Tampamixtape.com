const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../services/db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, artistName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileSlug = artistName
      ? artistName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : null;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        artistName,
        profileSlug,
        role: 'USER',
        status: 'PENDING',
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        artistName: user.artistName,
        profileSlug: user.profileSlug,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        artistName: user.artistName,
        profileSlug: user.profileSlug,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin login (uses env var for initial admin)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if it's the super admin from env
    if (email === adminEmail && password === adminPassword) {
      // Check if admin exists in DB, create if not
      let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

      if (!admin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        admin = await prisma.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: 'Admin',
            role: 'ADMIN',
            status: 'APPROVED',
          },
        });
      }

      const token = jwt.sign({ userId: admin.id, role: 'ADMIN' }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      return res.json({
        token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'ADMIN',
          status: 'APPROVED',
        },
      });
    }

    // Otherwise check database for admin users
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// Get current user (requires auth)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        artistName: true,
        profileSlug: true,
        bio: true,
        avatar: true,
        role: true,
        status: true,
        spotifyUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        websiteUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
