/* ============================================================
   Vi Microsystems Backend — Auth Middleware
   Used on routes that require the visitor to be logged in
   (e.g. viewing your own past orders). Reads the token from
   the Authorization header and attaches the user info to the
   request if valid; otherwise rejects the request.

   This one is REQUIRED (rejects if not logged in). For routes
   where login is optional (like checkout, which also allows
   guests), see optionalAuth below instead.
   ============================================================ */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'You must be logged in to do this.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

// Optional version: if a valid token is present, attach the user info.
// If not (or invalid), just continue as a guest — does not block the request.
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
    } catch (err) {
      // invalid token on an optional route — just treat as guest, no error
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
