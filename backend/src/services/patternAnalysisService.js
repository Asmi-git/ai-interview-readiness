const InterviewRecord = require('../models/InterviewRecord');
const Pattern = require('../models/Pattern');
const Recommendation = require('../models/Recommendation');
const { analyzeInterviews } = require('./aiServiceClient');
const { buildRecommendation } = require('./recommendationEngine');

/**
 * Finds the single most common struggle REASON among the interviews that
 * contributed to a pattern (by id). This is the concrete "why" evidence —
 * e.g. a DBMS/SQL pattern might be dominated by "Didn't know the concept"
 * (a learning gap) vs "Became nervous" (a performance-under-pressure
 * issue) — very different root causes, so this feeds both the "why was
 * this detected" UI and more specific recommendation text.
 * Returns null if none of the contributing interviews recorded a reason.
 */
function computeDominantReason(interviewIds, interviewsById) {
  const counts = {};
  interviewIds.forEach((id) => {
    const interview = interviewsById.get(id);
    (interview?.struggleReasons || []).forEach((reason) => {
      counts[reason] = (counts[reason] || 0) + 1;
    });
  });

  const entries = Object.entries(counts);
  if (entries.length === 0) return null;

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * Re-runs pattern detection for a user and persists the results. Called
 * after every interview create/update/delete so patterns always reflect
 * the user's current data — never computed lazily/stale on read.
 *
 * Design notes:
 * - Patterns have no "dismissed" concept, so they're safely fully replaced
 *   on every run with the latest analysis.
 * - Recommendations DO have a dismissed flag a user may have set, so those
 *   are synced (matched by category) rather than replaced, to preserve
 *   that state across re-analysis.
 * - If the AI service is unreachable, existing patterns/recommendations
 *   are left untouched rather than wiped — a transient outage shouldn't
 *   erase a user's data.
 */
async function refreshPatternsForUser(userId) {
  const interviews = await InterviewRecord.find({ userId });

  if (interviews.length < 2) {
    // Not enough data for a "recurring" pattern by definition — clear any
    // stale patterns from before a record was deleted, rather than leaving
    // patterns that no longer reflect the user's actual current data.
    await Pattern.deleteMany({ userId });
    await Recommendation.deleteMany({ userId });
    return { patterns: [], aiServiceAvailable: true };
  }

  const result = await analyzeInterviews(userId, interviews);

  if (!result) {
    console.error(`[patternAnalysisService] AI service unavailable — skipping pattern refresh for user ${userId}.`);
    return { patterns: null, aiServiceAvailable: false };
  }

  const patterns = result.patterns || [];
  const interviewsById = new Map(interviews.map((iv) => [String(iv._id), iv]));

  await Pattern.deleteMany({ userId });
  if (patterns.length > 0) {
    await Pattern.insertMany(
      patterns.map((p) => ({
        userId,
        category: p.category,
        frequency: p.frequency,
        interviewIds: p.interviewIds,
        trend: p.trend,
        source: p.source,
        dominantReason: computeDominantReason(p.interviewIds, interviewsById),
        lastDetectedAt: new Date(),
      }))
    );
  }

  const currentCategories = patterns.map((p) => p.category);
  await Recommendation.deleteMany({ userId, patternCategory: { $nin: currentCategories } });

  for (const pattern of patterns) {
    const dominantReason = computeDominantReason(pattern.interviewIds, interviewsById);
    const built = buildRecommendation({ ...pattern, dominantReason });
    const existing = await Recommendation.findOne({ userId, patternCategory: pattern.category });
    if (existing) {
      existing.recommendationText = built.recommendationText;
      existing.priority = built.priority;
      await existing.save();
    } else {
      await Recommendation.create({ userId, ...built });
    }
  }

  return { patterns, aiServiceAvailable: true };
}

module.exports = { refreshPatternsForUser, computeDominantReason };
