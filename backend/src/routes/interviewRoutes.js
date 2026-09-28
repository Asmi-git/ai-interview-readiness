const express = require('express');
const { body, param } = require('express-validator');
const {
  listInterviews,
  createInterview,
  getInterview,
  updateInterview,
  deleteInterview,
} = require('../controllers/interviewController');
const { validateRequest } = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const { INTERVIEW_TYPES, INTERVIEW_RESULTS, STRUGGLE_AREAS, STRUGGLE_REASONS } = require('../config/constants');

const router = express.Router();

const performanceField = (field, label) =>
  body(field).isInt({ min: 1, max: 5 }).withMessage(`${label} must be a rating between 1 and 5.`);

const interviewValidators = [
  body('companyName').trim().notEmpty().withMessage('Company/interview name is required.'),
  body('date').isISO8601().withMessage('A valid interview date is required.').toDate(),
  body('targetRole').trim().notEmpty().withMessage('Target role is required.'),
  body('interviewType').isIn(INTERVIEW_TYPES).withMessage('Please select a valid interview type.'),
  body('interviewRound').trim().notEmpty().withMessage('Interview round is required.'),
  body('result').isIn(INTERVIEW_RESULTS).withMessage('Please select a valid result.'),
  performanceField('technicalPerformance', 'Technical performance'),
  performanceField('communicationPerformance', 'Communication performance'),
  performanceField('confidenceLevel', 'Confidence level'),
  performanceField('projectExplanationPerformance', 'Project explanation performance'),
  body('struggleAreas').optional().isArray().withMessage('Struggle areas must be a list.'),
  body('struggleAreas.*').optional().isIn(STRUGGLE_AREAS).withMessage('One or more struggle areas are not recognized.'),
  body('struggleReasons').optional().isArray().withMessage('Struggle reasons must be a list.'),
  body('struggleReasons.*')
    .optional()
    .isIn(STRUGGLE_REASONS)
    .withMessage('One or more struggle reasons are not recognized.'),
  body('interviewerFeedback').optional({ checkFalsy: true }).trim(),
  body('description').optional({ checkFalsy: true }).trim(),
];

const idValidator = [param('id').isMongoId().withMessage('Invalid interview id.')];

router.use(requireAuth);

router.get('/', listInterviews);
router.post('/', interviewValidators, validateRequest, createInterview);
router.get('/:id', idValidator, validateRequest, getInterview);
router.put('/:id', idValidator, interviewValidators, validateRequest, updateInterview);
router.delete('/:id', idValidator, validateRequest, deleteInterview);

module.exports = router;
