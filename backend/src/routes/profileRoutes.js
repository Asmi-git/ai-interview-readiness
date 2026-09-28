const express = require('express');
const { body } = require('express-validator');
const { getProfile, upsertProfile } = require('../controllers/profileController');
const { validateRequest } = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const { EXPERIENCE_LEVELS, EDUCATION_LEVELS } = require('../config/constants');

const router = express.Router();

const profileValidators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('education').isIn(EDUCATION_LEVELS).withMessage('Please select a valid education level.'),
  body('degree').trim().notEmpty().withMessage('Degree is required.'),
  body('experienceLevel').isIn(EXPERIENCE_LEVELS).withMessage('Please select a valid experience level.'),
  body('targetRole').trim().notEmpty().withMessage('Target role is required.'),
  body('preferredIndustry').optional({ checkFalsy: true }).trim(),
  body('skills').optional().isArray().withMessage('Skills must be a list.'),
  body('careerGoal').optional({ checkFalsy: true }).trim(),
];

router.use(requireAuth);
router.get('/', getProfile);
router.put('/', profileValidators, validateRequest, upsertProfile);

module.exports = router;
