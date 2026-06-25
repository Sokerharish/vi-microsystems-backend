/* ============================================================
   Vi Microsystems Backend — Database Setup
   Uses SQLite (a single file on disk: vimicrosystems.db).
   This is the simplest real database to start with — no
   separate database server needed, the data file lives right
   alongside your code.

   NOTE: We use Node's BUILT-IN sqlite module (node:sqlite)
   instead of the better-sqlite3 package. This avoids a common
   Windows problem where better-sqlite3 needs Visual Studio
   Build Tools installed to compile native code. node:sqlite
   ships with Node.js itself (Node 22+) — nothing extra to
   install. It's labeled "experimental" by Node.js but is
   stable enough for this use case.
   ============================================================ */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// The .db file will be created automatically the first time the server runs.
const db = new DatabaseSync(path.join(__dirname, '..', 'vimicrosystems.db'));

// ---------- USERS TABLE ----------
// Stores registered accounts. Passwords are NEVER stored in plain text —
// they are hashed with bcrypt before saving (see routes/auth.js).
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// ---------- ORDERS TABLE ----------
// One row per order. user_id is NULL for guest checkouts (no login required).
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT,
    subtotal_inr REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// ---------- ORDER ITEMS TABLE ----------
// Each row is one product line within an order (product id, qty, price at time of order).
db.exec(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    unit_price_inr REAL NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  )
`);

// ---------- ENQUIRIES TABLE ----------
// Messages submitted from the "Product Enquiry / Request for Quote" forms.
db.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    product_name TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

console.log('Database ready: tables created (or already existed).');

/* ------------------------------------------------------------
   Small compatibility wrapper so the rest of the app (routes/*)
   can keep using the same simple .prepare(sql).get/all/run(...)
   style as before, regardless of the underlying driver.
------------------------------------------------------------- */
function prepare(sql) {
  const stmt = db.prepare(sql);
  return {
    get: (...params) => stmt.get(...params),
    all: (...params) => stmt.all(...params),
    run: (...params) => {
      const result = stmt.run(...params);
      return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
    }
  };
}

module.exports = { prepare, exec: (sql) => db.exec(sql) };
