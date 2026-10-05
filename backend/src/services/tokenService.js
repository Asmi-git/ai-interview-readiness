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
    httpOnly: true,   // not readable by client-side JS → mitigates XSS token theft
    secure: isProd,   // HTTPS only in production (required for sameSite:'none')
    // In production the frontend (Vercel) and backend (Render) are on different
    // domains, so the cookie must be cross-site: sameSite:'none' + secure:true.
    // Locally they're same-origin via the Vite proxy, so 'lax' is fine.
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/** Clears the session cookie (logout). */
function clearAuthCookie(res) {
  const cookieName = process.env.COOKIE_NAME || 'irp_session';
  const isProd = process.env.NODE_ENV === 'production';
  // Must pass the same options used when setting the cookie, otherwise
  // the browser won't match it and won't clear it.
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
}

module.exports = { signToken, setAuthCookie, clearAuthCookie };
