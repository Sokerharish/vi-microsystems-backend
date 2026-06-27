/* ============================================================
   Vi Microsystems Backend — User Profile Routes
   Handles: user profile management, password updates
   ============================================================ */

const express = require('express');
const bcrypt = require('bcryptjs');
const { prepare } = require('../db/setup');
const db = { prepare };
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- GET /api/users/profile ----------
// Returns current user's profile (requires auth)
router.get('/profile', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  
  res.json({ user });
});

// ---------- PUT /api/users/profile ----------
// Update current user's profile (requires auth)
router.put('/profile', requireAuth, (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.userId);
  
  const updated = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.userId);
  res.json({ user: updated });
});

// ---------- PUT /api/users/password ----------
// Update current user's password (requires auth)
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  
  const passwordMatches = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  
  const newPasswordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, req.userId);
  
  res.json({ message: 'Password updated successfully.' });
});

module.exports = router;
