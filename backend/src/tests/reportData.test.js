/**
 * Tests for buildReportData - pure data shaping, no DB or PDF rendering
 * involved. Run with: node src/tests/reportData.test.js
 */
const { buildReportData } = require('../services/reportService');

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

console.log('Report reflects a null score honestly, without fabricating one');
{
  const data = buildReportData({
    profile: null,
    readinessResult: { score: null, reasons: ['Log at least one interview experience.'] },
    patterns: [],
    recommendations: [],
    totalInterviews: 0,
  });
  assert(data.score === null, 'score is null, not a fabricated number');
  assert(data.scoreReasons.length > 0, 'reasons are carried through for the "not ready yet" message');
  assert(data.name === null, 'missing profile name is null, not "undefined" or a crash');
}

console.log('\nReport correctly shapes a populated dataset');
{
  const data = buildReportData({
    profile: { name: 'Asmi Sharma', targetRole: 'Software Developer' },
    readinessResult: {
      score: 68,
      reasons: [],
      breakdown: [{ key: 'technical', label: 'Technical readiness', value: 70, available: true }],
    },
    patterns: [
      { category: 'DBMS/SQL', frequency: 3, trend: 'stable', dominantReason: 'Became nervous' },
    ],
    recommendations: [{ patternCategory: 'DBMS/SQL', priority: 'high', recommendationText: 'Practice SQL joins.' }],
    totalInterviews: 5,
  });

  assert(data.name === 'Asmi Sharma', 'Profile name is carried through correctly');
  assert(data.targetRole === 'Software Developer', 'Target role is carried through correctly');
  assert(data.score === 68, 'Score is carried through correctly');
  assert(data.totalInterviews === 5, 'Total interview count is carried through correctly');
  assert(data.patterns[0].category === 'DBMS/SQL' && data.patterns[0].frequency === 3, 'Pattern data is correctly shaped');
  assert(data.patterns[0].dominantReason === 'Became nervous', 'Dominant reason is carried through');
  assert(
    data.recommendations[0].text === 'Practice SQL joins.' && data.recommendations[0].priority === 'high',
    'Recommendation data is correctly shaped'
  );
}

console.log('\nMissing dominantReason on a pattern is null, not undefined or a crash');
{
  const data = buildReportData({
    profile: { name: 'Test User' },
    readinessResult: { score: 50, reasons: [], breakdown: [] },
    patterns: [{ category: 'Confidence', frequency: 2, trend: 'stable' }], // no dominantReason field at all
    recommendations: [],
    totalInterviews: 2,
  });
  assert(data.patterns[0].dominantReason === null, 'Missing dominantReason normalizes to null');
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
