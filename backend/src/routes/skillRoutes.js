const express = require('express');
const { body } = require('express-validator');
const { getSkills, updateSkills } = require('../controllers/skillController');
const { validateRequest } = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const { ALL_SKILL_NAMES } = require('../config/constants');

const router = express.Router();

const updateValidators = [
  body('skills').isArray({ min: 1 }).withMessage('At least one skill must be provided.'),
  body('skills.*.skillName')
    .isIn(ALL_SKILL_NAMES)
    .withMessage('One or more skill names are not recognized.'),
  body('skills.*.level')
    .isInt({ min: 0, max: 100 })
    .withMessage('Skill level must be a number between 0 and 100.'),
];

router.use(requireAuth);
router.get('/', getSkills);
router.put('/', updateValidators, validateRequest, updateSkills);

module.exports = router;
