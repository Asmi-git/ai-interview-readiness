/**
 * Tests for computeDominantReason (the "why was this pattern detected"
 * evidence) and its effect on recommendation text. Pure functions, no DB.
 * Run with: node src/tests/dominantReason.test.js
 */
const { computeDominantReason } = require('../services/patternAnalysisService');
const { buildRecommendation } = require('../services/recommendationEngine');

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  \u2713 ${description}`);
    passed += 1;
  } else {
    console.log(`  \u2717 ${description}`);
    failed += 1;
  }
}

console.log('computeDominantReason picks the most common reason among contributing interviews');
{
  const interviewsById = new Map([
    ['1', { struggleReasons: ['Became nervous'] }],
    ['2', { struggleReasons: ['Became nervous', "Didn't know the concept"] }],
    ['3', { struggleReasons: ["Didn't know the concept"] }],
    ['4', { struggleReasons: ['Became nervous'] }],
  ]);
  const result = computeDominantReason(['1', '2', '3', '4'], interviewsById);
  assert(result === 'Became nervous', `"Became nervous" appears 3 times vs 2, correctly picked (got "${result}")`);
}

console.log('\ncomputeDominantReason only considers the specified contributing interviews, not all interviews');
{
  const interviewsById = new Map([
    ['1', { struggleReasons: ['Became nervous'] }],
    ['2', { struggleReasons: ["Didn't know the concept"] }], // NOT in the pattern's interviewIds
  ]);
  const result = computeDominantReason(['1'], interviewsById);
  assert(result === 'Became nervous', 'Only interview "1" is considered, ignoring interview "2"');
}

console.log('\ncomputeDominantReason returns null when no contributing interview recorded a reason');
{
  const interviewsById = new Map([
    ['1', { struggleReasons: [] }],
    ['2', { struggleReasons: undefined }],
  ]);
  const result = computeDominantReason(['1', '2'], interviewsById);
  assert(result === null, 'Returns null (not a fabricated reason) when nothing was recorded');
}

console.log('\nRecommendation text includes the dominant reason when available');
{
  const withReason = buildRecommendation({
    category: 'DBMS/SQL',
    frequency: 4,
    trend: 'stable',
    dominantReason: 'Became nervous',
  });
  assert(
    withReason.recommendationText.includes('Became nervous'),
    'Recommendation text explicitly names the dominant reason, not just the topic'
  );

  const withoutReason = buildRecommendation({
    category: 'DBMS/SQL',
    frequency: 4,
    trend: 'stable',
    dominantReason: null,
  });
  assert(
    !withoutReason.recommendationText.includes('Most often, the specific reason'),
    'No fabricated reason is appended when none was recorded'
  );
}

console.log('\nAn improving pattern still gets improvement-focused text, not reason-focused text');
{
  const improving = buildRecommendation({
    category: 'DBMS/SQL',
    frequency: 2,
    trend: 'decreasing',
    dominantReason: 'Became nervous',
  });
  assert(
    improving.recommendationText.includes('reduced'),
    'Improving pattern gets the encouragement template regardless of dominantReason'
  );
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
