const jwt = require('jsonwebtoken');

/** Signs a JWT for a given user id. */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** Sets the session token as an httpOnly cookie on the response. */
function setAuthCookie(res, token) {
  const cookieName = process.env.COOKIE_NAME || 'irp_session';
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie(cookieName, token, {
    httpOnly: true, // not readable by client-side JS -> mitigates XSS token theft
    secure: isProd, // HTTPS only in production
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/** Clears the session cookie (logout). */
function clearAuthCookie(res) {
  const cookieName = process.env.COOKIE_NAME || 'irp_session';
  res.clearCookie(cookieName);
}

module.exports = { signToken, setAuthCookie, clearAuthCookie };
