/**
 * Tests for the monthly progress comparison logic. Imports the actual
 * buildComparison function from progressService.js — not a re-implemented
 * copy — so this catches real regressions if the controller's logic ever
 * drifts from what's tested here.
 *
 * Run with: node src/tests/progressComparison.test.js
 */
const { currentMonthKey, buildComparison } = require('../services/progressService');

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

console.log('currentMonthKey formats dates correctly');
assert(currentMonthKey(new Date('2026-01-05')) === '2026-01', 'January formats as 2026-01 (zero-padded)');
assert(currentMonthKey(new Date('2026-11-20')) === '2026-11', 'November formats as 2026-11');
assert(currentMonthKey(new Date('2026-09-01')) === '2026-09', 'September (single digit) is zero-padded correctly');

console.log('\nSpec example: June -> August readiness improvement');
{
  const june = {
    month: '2026-06',
    readinessScore: 58,
    technicalScore: 65,
    communicationScore: 52,
    confidenceScore: 60,
    roleSkillCoverage: 70,
    patternCounts: { 'DBMS/SQL': 5 },
  };
  const august = {
    month: '2026-08',
    readinessScore: 74,
    technicalScore: 78,
    communicationScore: 68,
    confidenceScore: 72,
    roleSkillCoverage: 80,
    patternCounts: { 'DBMS/SQL': 2 },
  };

  const comparison = buildComparison(june, august);
  assert(comparison.from === '2026-06' && comparison.to === '2026-08', 'Comparison correctly spans June to August');
  assert(
    comparison.readiness.delta === 16,
    `Readiness improved by exactly 16 points (58 -> 74), got ${comparison.readiness.delta}`
  );
  assert(comparison.communication.delta === 16, 'Communication improved by exactly 16 points (52 -> 68)');
  assert(
    comparison.patternCounts['DBMS/SQL'].delta === -3,
    `DBMS/SQL occurrences reduced by 3 (5 -> 2), got ${comparison.patternCounts['DBMS/SQL'].delta}`
  );
  assert(
    comparison.patternCounts['DBMS/SQL'].from === 5 && comparison.patternCounts['DBMS/SQL'].to === 2,
    'Raw from/to values are preserved, not just the delta'
  );
}

console.log('\nA pattern present in only one of the two months is handled correctly');
{
  const older = { month: '2026-06', readinessScore: 50, patternCounts: { Confidence: 3 } };
  const recent = { month: '2026-07', readinessScore: 60, patternCounts: { 'DBMS/SQL': 2 } };
  const comparison = buildComparison(older, recent);
  assert(
    comparison.patternCounts.Confidence.from === 3 && comparison.patternCounts.Confidence.to === 0,
    'A resolved pattern (gone by the recent month) shows to: 0, not missing'
  );
  assert(
    comparison.patternCounts['DBMS/SQL'].from === 0 && comparison.patternCounts['DBMS/SQL'].to === 2,
    'A newly-appeared pattern shows from: 0, not missing'
  );
}

console.log('\nMissing data in either snapshot produces delta: null, never a fake number');
{
  const older = { month: '2026-06', readinessScore: null, patternCounts: {} };
  const recent = { month: '2026-07', readinessScore: 60, patternCounts: {} };
  const comparison = buildComparison(older, recent);
  assert(comparison.readiness.delta === null, 'Delta is null (not a fabricated number) when one side has no score yet');
  assert(comparison.readiness.to === 60, 'The available value is still reported even when delta cannot be computed');
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
