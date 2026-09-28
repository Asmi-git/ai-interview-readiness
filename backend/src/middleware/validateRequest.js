const { validationResult } = require('express-validator');

/**
 * Runs after express-validator check(...) middlewares.
 * If any validation failed, responds with 400 and a clear list of messages
 * instead of letting bad data reach the controller.
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Please fix the following errors.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { validateRequest };
