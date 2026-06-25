/* ============================================================
   Vi Microsystems Backend — Enquiries Routes
   Handles: the "Product Enquiry / Request for Quote" form on
   each product page.

   What changes vs. before: previously, submitting this form
   just opened the VISITOR's email app with a pre-filled draft —
   meaning if they closed it without hitting send, you (Harish)
   never saw it. Now, the message is:
     1. Saved permanently in the database (so nothing is ever lost)
     2. Emailed directly to your real inbox

   Email sending uses Nodemailer with Gmail. To make this work,
   you'll need a free "Gmail App Password" (NOT your normal Gmail
   password) — I'll walk you through that step when we deploy.
   ============================================================ */

const express = require('express');
const nodemailer = require('nodemailer');
const { prepare } = require('../db/setup');
const db = { prepare };

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Configure the email sender. If these environment variables aren't
// set, email sending is skipped (but the enquiry is still saved to
// the database, so nothing is lost either way).
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

// ---------- POST /api/enquiries ----------
router.post('/', async (req, res) => {
  const { name, email, subject, message, productName } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const insert = db.prepare(`
    INSERT INTO enquiries (name, email, subject, message, product_name, status)
    VALUES (?, ?, ?, ?, ?, 'new')
  `);
  const result = insert.run(
    name.trim(),
    email.trim().toLowerCase(),
    subject || null,
    message.trim(),
    productName || null
  );

  // Try to email the business owner. If this fails for any reason
  // (e.g. email not configured yet), we still tell the visitor it
  // succeeded, since the enquiry is safely saved in the database
  // regardless and you (the owner) can check it there.
  if (transporter && process.env.NOTIFY_EMAIL) {
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.NOTIFY_EMAIL,
        replyTo: email,
        subject: subject || `New enquiry: ${productName || 'General'}`,
        text: `New enquiry received on the website.

Name: ${name}
Email: ${email}
Product: ${productName || 'N/A'}

Message:
${message}`
      });
    } catch (err) {
      console.error('Failed to send enquiry email (enquiry was still saved):', err.message);
    }
  }

  res.status(201).json({ enquiry: { id: result.lastInsertRowid, name, email, subject, productName } });
});

module.exports = router;
