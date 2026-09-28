const Pattern = require('../models/Pattern');
const InterviewRecord = require('../models/InterviewRecord');
const { asyncHandler } = require('../middleware/errorHandler');

/** GET /api/patterns — highest frequency first, so the biggest issue leads. */
const listPatterns = asyncHandler(async (req, res) => {
  const [patterns, totalInterviews] = await Promise.all([
    Pattern.find({ userId: req.user.id }).sort({ frequency: -1 }),
    InterviewRecord.countDocuments({ userId: req.user.id }),
  ]);
  res.status(200).json({ success: true, patterns, totalInterviews });
});

module.exports = { listPatterns };
