const express = require('express');
const { getOptions } = require('../controllers/metaController');

const router = express.Router();

router.get('/options', getOptions);

module.exports = router;
