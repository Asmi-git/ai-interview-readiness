const Recommendation = require('../models/Recommendation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

/** GET /api/recommendations — active (non-dismissed) recommendations, highest priority first. */
const listRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await Recommendation.find({ userId: req.user.id, dismissed: false });
  recommendations.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  res.status(200).json({ success: true, recommendations });
});

/** PUT /api/recommendations/:id/dismiss */
const dismissRecommendation = asyncHandler(async (req, res) => {
  const recommendation = await Recommendation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!recommendation) {
    throw new AppError('Recommendation not found.', 404);
  }
  recommendation.dismissed = true;
  await recommendation.save();
  res.status(200).json({ success: true, message: 'Recommendation dismissed.' });
});

module.exports = { listRecommendations, dismissRecommendation };
