/* ============================================================
   Vi Microsystems Backend — Blog Routes
   Handles: CRUD operations for blog posts, listing published posts,
   and blog post management
   ============================================================ */

const express = require('express');
const { prepare } = require('../db/setup');
const db = { prepare };
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- GET /api/blog ----------
// Returns all published blog posts (public endpoint)
router.get('/', (req, res) => {
  const { category, limit } = req.query;
  
  let query = 'SELECT * FROM blog_posts WHERE is_published = 1';
  const params = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY published_at DESC';
  
  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }
  
  const posts = db.prepare(query).all(...params);
  res.json({ posts });
});

// ---------- GET /api/blog/:slug ----------
// Returns a single blog post by slug (public endpoint)
router.get('/:slug', (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND is_published = 1').get(req.params.slug);
  
  if (!post) {
    return res.status(404).json({ error: 'Blog post not found.' });
  }
  
  res.json({ post });
});

// ---------- POST /api/blog ----------
// Create a new blog post (admin only - requires auth)
router.post('/', requireAuth, (req, res) => {
  const { 
    title, 
    slug, 
    excerpt, 
    content, 
    author, 
    image_url, 
    category, 
    is_published 
  } = req.body;
  
  if (!title || !slug || !content) {
    return res.status(400).json({ error: 'Title, slug, and content are required.' });
  }
  
  try {
    const insert = db.prepare(`
      INSERT INTO blog_posts (title, slug, excerpt, content, author, image_url, category, is_published, published_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    const result = insert.run(
      title,
      slug,
      excerpt || null,
      content,
      author || null,
      image_url || null,
      category || null,
      is_published ? 1 : 0,
      is_published ? "datetime('now')" : null
    );
    
    res.status(201).json({
      post: {
        id: result.lastInsertRowid,
        title,
        slug,
        excerpt,
        content,
        author,
        image_url,
        category,
        is_published: is_published ? 1 : 0
      }
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'A blog post with this slug already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create blog post.' });
  }
});

// ---------- PUT /api/blog/:slug ----------
// Update an existing blog post (admin only - requires auth)
router.put('/:slug', requireAuth, (req, res) => {
  const { 
    title, 
    excerpt, 
    content, 
    author, 
    image_url, 
    category, 
    is_published 
  } = req.body;
  
  const existing = db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(req.params.slug);
  if (!existing) {
    return res.status(404).json({ error: 'Blog post not found.' });
  }
  
  try {
    const update = db.prepare(`
      UPDATE blog_posts 
      SET title = ?, excerpt = ?, content = ?, author = ?, image_url = ?, 
          category = ?, is_published = ?, published_at = ?, updated_at = datetime('now')
      WHERE slug = ?
    `);
    
    // If publishing for the first time, set published_at
    const publishedAt = (is_published && !existing.is_published) ? "datetime('now')" : existing.published_at;
    
    update.run(
      title || existing.title,
      excerpt !== undefined ? excerpt : existing.excerpt,
      content !== undefined ? content : existing.content,
      author !== undefined ? author : existing.author,
      image_url !== undefined ? image_url : existing.image_url,
      category !== undefined ? category : existing.category,
      is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published,
      publishedAt,
      req.params.slug
    );
    
    const updated = db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(req.params.slug);
    res.json({ post: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update blog post.' });
  }
});

// ---------- DELETE /api/blog/:slug ----------
// Delete a blog post (admin only - requires auth)
router.delete('/:slug', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(req.params.slug);
  if (!existing) {
    return res.status(404).json({ error: 'Blog post not found.' });
  }
  
  db.prepare('DELETE FROM blog_posts WHERE slug = ?').run(req.params.slug);
  
  res.json({ message: 'Blog post deleted successfully.' });
});

// ---------- GET /api/blog/admin/all ----------
// Returns all blog posts including drafts (admin only - requires auth)
router.get('/admin/all', requireAuth, (req, res) => {
  const posts = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
  res.json({ posts });
});

module.exports = router;
