const { RECOMMENDATION_TEXTS, GENERIC_TEMPLATE, IMPROVEMENT_TEMPLATE } = require('./recommendationKnowledgeBase');

/**
 * Determines priority from the pattern's frequency and trend.
 * A decreasing trend means the issue is already improving — that gets
 * "low" priority (encouragement, not urgency) regardless of raw frequency,
 * since frequency alone would otherwise over-penalize a user who is
 * actively getting better.
 */
function priorityFor(pattern) {
  if (pattern.trend === 'decreasing') return 'low';
  if (pattern.trend === 'increasing' || pattern.frequency >= 4) return 'high';
  return 'medium';
}

/**
 * Builds one recommendation object from a detected pattern. Never gives
 * the same generic text to every user — text is a function of this
 * specific pattern's category, frequency, trend, and (when available)
 * the dominant struggle REASON behind it, so the recommendation explains
 * itself instead of just naming the topic again.
 */
function buildRecommendation(pattern) {
  const priority = priorityFor(pattern);

  let recommendationText;
  if (pattern.trend === 'decreasing') {
    recommendationText = IMPROVEMENT_TEMPLATE(pattern.category, pattern.frequency);
  } else {
    const templates = RECOMMENDATION_TEXTS[pattern.category];
    if (templates) {
      recommendationText = templates[priority];
    } else {
      // Category came from the AI service's semantic fallback (an "Emerging
      // pattern: ..." label not in the fixed taxonomy) — use the generic template.
      recommendationText = GENERIC_TEMPLATE[priority](pattern.category, pattern.frequency);
    }

    if (pattern.dominantReason) {
      recommendationText += ` Most often, the specific reason recorded was "${pattern.dominantReason}" — worth targeting that directly, not just the topic generally.`;
    }
  }

  return {
    patternCategory: pattern.category,
    recommendationText,
    priority,
  };
}

module.exports = { buildRecommendation, priorityFor };
