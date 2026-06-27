/* ============================================================
   Vi Microsystems Backend — Products Routes
   Handles: CRUD operations for products, product listing,
   and product search/filtering
   ============================================================ */

const express = require('express');
const { prepare } = require('../db/setup');
const db = { prepare };
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- GET /api/products ----------
// Returns all active products (public endpoint)
router.get('/', (req, res) => {
  const { category, search } = req.query;
  
  let query = 'SELECT * FROM products WHERE is_active = 1';
  const params = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const products = db.prepare(query).all(...params);
  res.json({ products });
});

// ---------- GET /api/products/:id ----------
// Returns a single product by product_id (public endpoint)
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE product_id = ? AND is_active = 1').get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  
  res.json({ product });
});

// ---------- POST /api/products ----------
// Create a new product (admin only - requires auth)
router.post('/', requireAuth, (req, res) => {
  const { 
    product_id, 
    name, 
    description, 
    price_inr, 
    is_placeholder, 
    image_url, 
    page_url, 
    category, 
    specifications, 
    stock_quantity 
  } = req.body;
  
  if (!product_id || !name) {
    return res.status(400).json({ error: 'Product ID and name are required.' });
  }
  
  try {
    const insert = db.prepare(`
      INSERT INTO products (product_id, name, description, price_inr, is_placeholder, image_url, page_url, category, specifications, stock_quantity, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    const result = insert.run(
      product_id,
      name,
      description || null,
      price_inr || null,
      is_placeholder ? 1 : 0,
      image_url || null,
      page_url || null,
      category || null,
      specifications || null,
      stock_quantity || 0
    );
    
    res.status(201).json({
      product: {
        id: result.lastInsertRowid,
        product_id,
        name,
        description,
        price_inr,
        is_placeholder: is_placeholder ? 1 : 0,
        image_url,
        page_url,
        category,
        specifications,
        stock_quantity
      }
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'A product with this ID already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

// ---------- PUT /api/products/:id ----------
// Update an existing product (admin only - requires auth)
router.put('/:id', requireAuth, (req, res) => {
  const { 
    name, 
    description, 
    price_inr, 
    is_placeholder, 
    image_url, 
    page_url, 
    category, 
    specifications, 
    stock_quantity,
    is_active 
  } = req.body;
  
  const existing = db.prepare('SELECT * FROM products WHERE product_id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  
  try {
    const update = db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price_inr = ?, is_placeholder = ?, image_url = ?, 
          page_url = ?, category = ?, specifications = ?, stock_quantity = ?, 
          is_active = ?, updated_at = datetime('now')
      WHERE product_id = ?
    `);
    
    update.run(
      name || existing.name,
      description !== undefined ? description : existing.description,
      price_inr !== undefined ? price_inr : existing.price_inr,
      is_placeholder !== undefined ? (is_placeholder ? 1 : 0) : existing.is_placeholder,
      image_url !== undefined ? image_url : existing.image_url,
      page_url !== undefined ? page_url : existing.page_url,
      category !== undefined ? category : existing.category,
      specifications !== undefined ? specifications : existing.specifications,
      stock_quantity !== undefined ? stock_quantity : existing.stock_quantity,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      req.params.id
    );
    
    const updated = db.prepare('SELECT * FROM products WHERE product_id = ?').get(req.params.id);
    res.json({ product: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update product.' });
  }
});

// ---------- DELETE /api/products/:id ----------
// Soft delete a product (admin only - requires auth)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE product_id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  
  db.prepare('UPDATE products SET is_active = 0, updated_at = datetime("now") WHERE product_id = ?').run(req.params.id);
  
  res.json({ message: 'Product deactivated successfully.' });
});

module.exports = router;
