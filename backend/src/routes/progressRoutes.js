const express = require('express');
const { getMonthlyProgress } = require('../controllers/progressController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/monthly', getMonthlyProgress);

module.exports = router;
