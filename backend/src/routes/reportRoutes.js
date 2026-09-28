const express = require('express');
const { downloadReadinessReport } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/readiness', downloadReadinessReport);

module.exports = router;
