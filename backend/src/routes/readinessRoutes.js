const express = require('express');
const { getReadinessScore } = require('../controllers/readinessController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', getReadinessScore);

module.exports = router;
