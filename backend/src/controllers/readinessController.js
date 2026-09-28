const Profile = require('../models/Profile');
const InterviewRecord = require('../models/InterviewRecord');
const Pattern = require('../models/Pattern');
const { asyncHandler } = require('../middleware/errorHandler');
const { computeReadinessScore } = require('../services/readinessScoreService');
const { getLatestSkillLevels } = require('../services/skillsService');
const { recordSnapshotForUser } = require('../services/progressService');

/** GET /api/readiness */
const getReadinessScore = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [profile, skillLevels, interviews, patterns] = await Promise.all([
    Profile.findOne({ userId }),
    getLatestSkillLevels(userId),
    InterviewRecord.find({ userId }),
    Pattern.find({ userId }),
  ]);

  const result = computeReadinessScore({
    targetRole: profile?.targetRole,
    skillLevels,
    interviews,
    patterns,
  });

  // Snapshot this month's numbers for later comparison. Never let a
  // snapshot failure break the readiness score response itself.
  try {
    await recordSnapshotForUser(req.user.id);
  } catch (err) {
    console.error('[readinessController] Failed to record progress snapshot:', err.message);
  }

  res.status(200).json({ success: true, ...result });
});

module.exports = { getReadinessScore };
