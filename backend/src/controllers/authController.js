const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { signToken, setAuthCookie, clearAuthCookie } = require('../services/tokenService');

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Creates a new user with a securely hashed password, logs them in immediately.
 */
const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash });

  const token = signToken(user._id);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    user: { id: user._id, email: user.email },
    token, // also returned in body so API clients (Postman, mobile) can use Bearer auth
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken(user._id);
  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    user: { id: user._id, email: user.email },
    token,
  });
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user. Requires requireAuth middleware.
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  res.status(200).json({ success: true, user });
});

/**
 * PUT /api/auth/password
 * Requires the current password to be correct before allowing a change —
 * standard security practice so a hijacked session token alone can't be
 * used to lock the real owner out by changing their password.
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

module.exports = { register, login, logout, getMe, changePassword };
