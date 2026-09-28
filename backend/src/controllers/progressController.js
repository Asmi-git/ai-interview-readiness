const ProgressHistory = require('../models/ProgressHistory');
const { asyncHandler } = require('../middleware/errorHandler');
const { buildComparison } = require('../services/progressService');

/** GET /api/progress/monthly */
const getMonthlyProgress = asyncHandler(async (req, res) => {
  const snapshots = await ProgressHistory.find({ userId: req.user.id }).sort({ month: 1 });

  let comparison = null;
  if (snapshots.length >= 2) {
    const recentSnapshot = snapshots[snapshots.length - 1];
    const olderSnapshot = snapshots[snapshots.length - 2];
    comparison = buildComparison(olderSnapshot, recentSnapshot);
  }

  res.status(200).json({ success: true, snapshots, comparison });
});

module.exports = { getMonthlyProgress };
