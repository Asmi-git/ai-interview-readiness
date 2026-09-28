const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe, changePassword } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const registerValidators = [
  body('email').isEmail().withMessage('A valid email address is required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.'),
];

const loginValidators = [
  body('email').isEmail().withMessage('A valid email address is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long.')
    .matches(/\d/)
    .withMessage('New password must contain at least one number.'),
];

router.post('/register', registerValidators, validateRequest, register);
router.post('/login', loginValidators, validateRequest, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.put('/password', requireAuth, changePasswordValidators, validateRequest, changePassword);

module.exports = router;
