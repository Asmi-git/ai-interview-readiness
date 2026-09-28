const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

/**
 * Protects a route: requires a valid JWT, either from the httpOnly cookie
 * (browser flow) or an Authorization: Bearer header (useful for Postman/testing).
 * On success, attaches { id } to req.user.
 */
function requireAuth(req, res, next) {
  const cookieName = process.env.COOKIE_NAME || 'irp_session';
  let token = req.cookies ? req.cookies[cookieName] : undefined;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You must be logged in to access this resource.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return next(new AppError('Your session is invalid or has expired. Please log in again.', 401));
  }
}

module.exports = { requireAuth };
