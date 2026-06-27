/* ============================================================
   Vi Microsystems Backend — Newsletter Routes
   Handles: newsletter subscription and management
   ============================================================ */

const express = require('express');
const { prepare } = require('../db/setup');
const db = { prepare };

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- POST /api/newsletter/subscribe ----------
// Subscribe to newsletter (public endpoint)
router.post('/subscribe', (req, res) => {
  const { email, name } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const insert = db.prepare(`
      INSERT INTO newsletter_subscribers (email, name, is_active)
      VALUES (?, ?, 1)
    `);
    
    const result = insert.run(normalizedEmail, name ? name.trim() : null);
    
    res.status(201).json({
      message: 'Successfully subscribed to newsletter.',
      subscriber: {
        id: result.lastInsertRowid,
        email: normalizedEmail,
        name
      }
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'This email is already subscribed.' });
    }
    return res.status(500).json({ error: 'Failed to subscribe to newsletter.' });
  }
});

// ---------- POST /api/newsletter/unsubscribe ----------
// Unsubscribe from newsletter (public endpoint)
router.post('/unsubscribe', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  
  const existing = db.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?').get(normalizedEmail);
  if (!existing) {
    return res.status(404).json({ error: 'Email not found in subscriber list.' });
  }
  
  db.prepare('UPDATE newsletter_subscribers SET is_active = 0 WHERE email = ?').run(normalizedEmail);
  
  res.json({ message: 'Successfully unsubscribed from newsletter.' });
});

module.exports = router;
