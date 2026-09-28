const Profile = require('../models/Profile');
const InterviewRecord = require('../models/InterviewRecord');
const Pattern = require('../models/Pattern');
const ProgressHistory = require('../models/ProgressHistory');
const { computeReadinessScore } = require('./readinessScoreService');
const { getLatestSkillLevels } = require('./skillsService');

function currentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function componentValue(breakdown, key) {
  const component = breakdown?.find((c) => c.key === key);
  return component && component.available ? component.value : null;
}

/**
 * Computes the current readiness score and pattern frequencies, then
 * upserts a snapshot for the CURRENT calendar month (upsert, not append —
 * revisiting the dashboard multiple times in the same month updates that
 * month's snapshot rather than creating duplicates). This is what lets
 * monthly comparison work without needing a cron job: the snapshot is
 * simply "whatever the numbers were, last time this month was recorded".
 */
async function recordSnapshotForUser(userId) {
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

  const patternCounts = Object.fromEntries(patterns.map((p) => [p.category, p.frequency]));

  await ProgressHistory.findOneAndUpdate(
    { userId, month: currentMonthKey() },
    {
      $set: {
        readinessScore: result.score,
        technicalScore: componentValue(result.breakdown, 'technical'),
        communicationScore: componentValue(result.breakdown, 'communication'),
        confidenceScore: componentValue(result.breakdown, 'confidence'),
        roleSkillCoverage: componentValue(result.breakdown, 'roleCoverage'),
        patternCounts,
      },
    },
    { upsert: true, new: true }
  );
}

function deltaOf(field, from, to) {
  const fromVal = from ? from[field] : null;
  const toVal = to ? to[field] : null;
  if (fromVal === null || toVal === null) return { from: fromVal, to: toVal, delta: null };
  return { from: fromVal, to: toVal, delta: toVal - fromVal };
}

/** Builds a from/to/delta comparison between two monthly snapshots,
 * including a per-category pattern-count comparison. A category present
 * in only one snapshot is treated as 0 in the other (resolved or new),
 * not omitted. */
function buildComparison(olderSnapshot, recentSnapshot) {
  const categories = new Set([
    ...Object.keys(olderSnapshot.patternCounts || {}),
    ...Object.keys(recentSnapshot.patternCounts || {}),
  ]);

  const patternCounts = {};
  categories.forEach((category) => {
    const from = olderSnapshot.patternCounts?.[category] ?? 0;
    const to = recentSnapshot.patternCounts?.[category] ?? 0;
    patternCounts[category] = { from, to, delta: to - from };
  });

  return {
    from: olderSnapshot.month,
    to: recentSnapshot.month,
    readiness: deltaOf('readinessScore', olderSnapshot, recentSnapshot),
    technical: deltaOf('technicalScore', olderSnapshot, recentSnapshot),
    communication: deltaOf('communicationScore', olderSnapshot, recentSnapshot),
    confidence: deltaOf('confidenceScore', olderSnapshot, recentSnapshot),
    roleCoverage: deltaOf('roleSkillCoverage', olderSnapshot, recentSnapshot),
    patternCounts,
  };
}

module.exports = { recordSnapshotForUser, currentMonthKey, buildComparison };
