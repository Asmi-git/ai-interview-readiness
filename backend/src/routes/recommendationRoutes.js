const express = require('express');
const { param } = require('express-validator');
const { listRecommendations, dismissRecommendation } = require('../controllers/recommendationController');
const { validateRequest } = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', listRecommendations);
router.put(
  '/:id/dismiss',
  [param('id').isMongoId().withMessage('Invalid recommendation id.')],
  validateRequest,
  dismissRecommendation
);

module.exports = router;
