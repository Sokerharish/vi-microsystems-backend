/* ============================================================
   Vi Microsystems Backend — Admin Routes
   Handles: admin operations for order status, enquiry status,
   and viewing all data for management
   ============================================================ */

const express = require('express');
const { prepare } = require('../db/setup');
const db = { prepare };
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- GET /api/admin/orders ----------
// Returns all orders (admin only - requires auth)
router.get('/orders', requireAuth, (req, res) => {
  const { status } = req.query;
  
  let query = 'SELECT id, customer_name, customer_email, customer_phone, subtotal_inr, currency, status, created_at FROM orders';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const orders = db.prepare(query).all(...params);
  
  const ordersWithItems = orders.map((order) => {
    const items = db.prepare(`
      SELECT product_id, product_name, unit_price_inr, quantity
      FROM order_items WHERE order_id = ?
    `).all(order.id);
    return { ...order, items };
  });
  
  res.json({ orders: ordersWithItems });
});

// ---------- PUT /api/admin/orders/:id/status ----------
// Update order status (admin only - requires auth)
router.put('/orders/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }
  
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ') });
  }
  
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order: updated });
});

// ---------- GET /api/admin/enquiries ----------
// Returns all enquiries (admin only - requires auth)
router.get('/enquiries', requireAuth, (req, res) => {
  const { status } = req.query;
  
  let query = 'SELECT * FROM enquiries';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const enquiries = db.prepare(query).all(...params);
  res.json({ enquiries });
});

// ---------- PUT /api/admin/enquiries/:id/status ----------
// Update enquiry status (admin only - requires auth)
router.put('/enquiries/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }
  
  const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ') });
  }
  
  const existing = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Enquiry not found.' });
  }
  
  db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, req.params.id);
  
  const updated = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(req.params.id);
  res.json({ enquiry: updated });
});

// ---------- GET /api/admin/users ----------
// Returns all users (admin only - requires auth)
router.get('/users', requireAuth, (req, res) => {
  const users = db.prepare('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// ---------- GET /api/admin/dashboard ----------
// Returns dashboard statistics (admin only - requires auth)
router.get('/dashboard', requireAuth, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalEnquiries = db.prepare('SELECT COUNT(*) as count FROM enquiries').get().count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalRevenue = db.prepare('SELECT SUM(subtotal_inr) as total FROM orders WHERE status != "cancelled"').get().total || 0;
  
  const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = "pending"').get().count;
  const newEnquiries = db.prepare('SELECT COUNT(*) as count FROM enquiries WHERE status = "new"').get().count;
  
  const recentOrders = db.prepare(`
    SELECT id, customer_name, subtotal_inr, status, created_at 
    FROM orders ORDER BY created_at DESC LIMIT 5
  `).all();
  
  const recentEnquiries = db.prepare(`
    SELECT id, name, email, subject, created_at 
    FROM enquiries ORDER BY created_at DESC LIMIT 5
  `).all();
  
  res.json({
    stats: {
      totalOrders,
      totalEnquiries,
      totalUsers,
      totalRevenue,
      pendingOrders,
      newEnquiries
    },
    recentOrders,
    recentEnquiries
  });
});

module.exports = router;
