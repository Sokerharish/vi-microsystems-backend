/* ============================================================
   Vi Microsystems Backend — Main Server
   This is the file that actually starts everything running.
   ============================================================ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { prepare } = require('./db/setup');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const enquiryRoutes = require('./routes/enquiries');
const productRoutes = require('./routes/products');
const blogRoutes = require('./routes/blog');
const newsletterRoutes = require('./routes/newsletter');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: allows your website (running on a different domain, like
// netlify.app) to talk to this server. In production, replace '*'
// with your actual site's URL for better security — I'll show you
// how when we deploy.
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Simple health check — visiting this URL confirms the server is running.
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Vi Microsystems backend is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Catch-all error handler — so unexpected errors return a clean
// JSON response instead of crashing the server or leaking details.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
});

// Auto-seed database on startup if products table is empty
const db = { prepare };
const checkProducts = db.prepare('SELECT COUNT(*) as count FROM products');
const productCount = checkProducts.get();

if (productCount.count === 0) {
  console.log('Database is empty. Running seed...');
  require('./seed');
}

app.listen(PORT, () => {
  console.log(`Vi Microsystems backend listening on port ${PORT}`);
});
