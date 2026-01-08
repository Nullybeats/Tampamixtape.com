const express = require('express');
const emailService = require('../services/email');

const router = express.Router();

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'All fields are required: name, email, subject, message',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate message length
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
    }

    // Send email
    const result = await emailService.sendContactFormEmail({
      name,
      email,
      subject,
      message,
    });

    if (result.success) {
      res.json({ message: 'Message sent successfully. We\'ll get back to you soon.' });
    } else if (result.reason === 'not_configured') {
      // Email not configured, but we can still acknowledge receipt
      console.log('Contact form submission (email not configured):', { name, email, subject });
      res.json({ message: 'Message received. We\'ll get back to you soon.' });
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
