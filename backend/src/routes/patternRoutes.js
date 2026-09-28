const express = require('express');
const { listPatterns } = require('../controllers/patternController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', listPatterns);

module.exports = router;
