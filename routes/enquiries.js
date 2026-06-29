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
   password) — which is already configured in your environment.
   ============================================================ */

const express = require('express');
const nodemailer = require('nodemailer');
const { prepare } = require('../db/setup');
const db = { prepare };

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Configure the email sender using Port 465 to bypass cloud hosting restrictions
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,         // Secure SSL Port (bypasses Render's default outbound blocks)
    secure: true,      // Set to true because port 465 requires native SSL/TLS
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Helps prevent SSL certificate restrictions on cloud platforms
    },
    connectionTimeout: 30000, // 30 seconds timeout limit for better reliability
    greetingTimeout: 15000    // 15 seconds limit to wait for SMTP greetings
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
    // 1. Save the enquiry permanently inside the SQLite database
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

    // 2. Try to dispatch the email to your business address via the SSL tunnel
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
      emailSentSuccessfully = false; 
    }

    // Compile payload status response
    const responsePayload = { 
      enquiry: { 
        id: result.lastInsertRowid, 
        name, 
        email, 
        subject, 
        productName 
      } 
    };

    // If data was written to DB successfully but Gmail transmission timed out / failed
    if (!emailSentSuccessfully) {
      responsePayload.emailFailed = true;
      return res.status(207).json(responsePayload); // Matches the product-extras.js graceful error UI handler
    }

    // Absolute immediate deployment success response
    return res.status(201).json(responsePayload);

  } catch (dbError) {
    console.error('Database Error:', dbError.message);
    return res.status(500).json({ error: 'Failed to record your enquiry in our database.' });
  }
});

module.exports = router;