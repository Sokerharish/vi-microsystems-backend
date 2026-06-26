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

// Configure the email sender with explicit connection limits to prevent hanging
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for port 465, false for other ports like 587
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Prevents cloud hosting certificate blocks
    },
    connectionTimeout: 10000, // 10 seconds limit to establish socket connection
    greetingTimeout: 10000    // 10 seconds limit to wait for SMTP greeting
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

  try {
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

    let emailSentSuccessfully = true;

    // Try to email the business owner.
    if (transporter && process.env.NOTIFY_EMAIL) {
      try {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.NOTIFY_EMAIL,
          replyTo: email,
          subject: subject || `New enquiry: ${productName || 'General'}`,
          text: `New enquiry received on the website.\n\nName: ${name}\nEmail: ${email}\nProduct: ${productName || 'N/A'}\n\nMessage:\n${message}`
        });
      } catch (err) {
        console.error('Failed to send enquiry email (enquiry was still saved):', err.message);
        emailSentSuccessfully = false;
      }
    } else {
      // If environment keys are totally missing, mark as failed so frontend knows
      emailSentSuccessfully = false; 
    }

    // Prepare response data payload
    const responsePayload = { 
      enquiry: { 
        id: result.lastInsertRowid, 
        name, 
        email, 
        subject, 
        productName 
      } 
    };

    // If database insertion succeeded but email failed/timed out, send a 207 status
    if (!emailSentSuccessfully) {
      responsePayload.emailFailed = true;
      return res.status(207).json(responsePayload);
    }

    // Standard absolute success response
    return res.status(201).json(responsePayload);

  } catch (dbError) {
    console.error('Database Error:', dbError.message);
    return res.status(500).json({ error: 'Failed to record your enquiry in our database.' });
  }
});

module.exports = router;