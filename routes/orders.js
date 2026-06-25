/* ============================================================
   Vi Microsystems Backend — Orders Routes
   Handles: creating an order at checkout, viewing order history.

   Note: this does NOT process real payment yet (that's a
   later step with Razorpay). Right now, placing an order just
   records it in the database with status "pending" — like a
   cash-on-delivery / "we'll contact you" order, so the business
   owner can see and follow up on it.
   ============================================================ */

const express = require('express');
const { prepare } = require('../db/setup');
const db = { prepare };
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- POST /api/orders ----------
// Creates a new order. Works for both logged-in users and guests.
// Expected body: {
//   customerName, customerEmail, customerPhone, shippingAddress,
//   currency, items: [{ productId, productName, unitPriceInr, quantity }]
// }
router.post('/', optionalAuth, (req, res) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, currency, items } = req.body;

  if (!customerName || !customerEmail) {
    return res.status(400).json({ error: 'Customer name and email are required.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }

  for (const item of items) {
    if (!item.productId || !item.productName || !item.unitPriceInr || !item.quantity) {
      return res.status(400).json({ error: 'Each order item needs productId, productName, unitPriceInr, and quantity.' });
    }
  }

  const subtotalInr = items.reduce((sum, item) => sum + item.unitPriceInr * item.quantity, 0);

  const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, shipping_address, subtotal_inr, currency, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  const orderResult = insertOrder.run(
    req.userId || null,
    customerName.trim(),
    customerEmail.trim().toLowerCase(),
    customerPhone || null,
    shippingAddress || null,
    subtotalInr,
    currency || 'INR'
  );

  const orderId = orderResult.lastInsertRowid;

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, unit_price_inr, quantity)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const item of items) {
    insertItem.run(orderId, item.productId, item.productName, item.unitPriceInr, item.quantity);
  }

  res.status(201).json({
    order: {
      id: orderId,
      customerName,
      customerEmail,
      subtotalInr,
      currency: currency || 'INR',
      status: 'pending',
      items
    }
  });
});

// ---------- GET /api/orders/mine ----------
// Returns the order history for the currently logged-in user.
// Requires login (guests have no account to look up orders under).
router.get('/mine', requireAuth, (req, res) => {
  const orders = db.prepare(`
    SELECT id, customer_name, customer_email, subtotal_inr, currency, status, created_at
    FROM orders WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.userId);

  const ordersWithItems = orders.map((order) => {
    const items = db.prepare(`
      SELECT product_id, product_name, unit_price_inr, quantity
      FROM order_items WHERE order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  res.json({ orders: ordersWithItems });
});

// ---------- GET /api/orders/:id ----------
// Returns a single order by id (used for an order confirmation page).
// Anyone with the order id can view it for now — fine for a
// confirmation page, since order ids aren't guessable in sequence
// the way emails/passwords would be sensitive.
router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT id, customer_name, customer_email, subtotal_inr, currency, status, created_at
    FROM orders WHERE id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const items = db.prepare(`
    SELECT product_id, product_name, unit_price_inr, quantity
    FROM order_items WHERE order_id = ?
  `).all(order.id);

  res.json({ order: { ...order, items } });
});

module.exports = router;
