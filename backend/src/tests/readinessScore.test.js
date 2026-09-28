/**
 * Unit tests for the readiness score formula. This is pure computation
 * with no DB dependency, so every case here is a real, deterministic check
 * — not a mock. Run with: node src/tests/readinessScore.test.js
 */
const { computeReadinessScore } = require('../services/readinessScoreService');
const { ALL_SKILL_NAMES } = require('../config/constants');

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

function emptySkillLevels() {
  return Object.fromEntries(ALL_SKILL_NAMES.map((name) => [name, null]));
}

function makeInterview(overrides) {
  return {
    date: '2026-01-01',
    technicalPerformance: 3,
    communicationPerformance: 3,
    confidenceLevel: 3,
    projectExplanationPerformance: 3,
    ...overrides,
  };
}

console.log('No interviews at all — score must be null, not a fabricated number');
{
  const result = computeReadinessScore({
    targetRole: 'Software Developer',
    skillLevels: emptySkillLevels(),
    interviews: [],
    patterns: [],
  });
  assert(result.score === null, 'Score is null with zero interviews');
  assert(result.reasons.length > 0, 'A clear reason is given for why no score exists yet');
}

console.log('\nOnly interview data, no profile/skills — score still computes from what exists');
{
  const result = computeReadinessScore({
    targetRole: undefined,
    skillLevels: emptySkillLevels(),
    interviews: [makeInterview({}), makeInterview({})],
    patterns: [],
  });
  assert(result.score !== null, 'Score computes from interview performance alone');
  assert(
    result.breakdown.find((c) => c.key === 'roleCoverage').available === false,
    'Role coverage is correctly marked unavailable with no target role'
  );
  assert(result.reasons.some((r) => r.includes('target role')), 'Explains that adding a target role would help');
}

console.log('\nMax possible interview ratings should produce a high (not necessarily 100) score');
{
  const skillLevels = Object.fromEntries(ALL_SKILL_NAMES.map((name) => [name, 90]));
  const result = computeReadinessScore({
    targetRole: 'Software Developer',
    skillLevels,
    interviews: [
      makeInterview({ date: '2026-01-01', technicalPerformance: 5, communicationPerformance: 5, confidenceLevel: 5, projectExplanationPerformance: 5 }),
      makeInterview({ date: '2026-02-01', technicalPerformance: 5, communicationPerformance: 5, confidenceLevel: 5, projectExplanationPerformance: 5 }),
    ],
    patterns: [],
  });
  assert(result.score >= 85, `Excellent inputs across the board produce a high score (got ${result.score})`);
}

console.log('\nWorst possible ratings should produce a low score, not artificially padded');
{
  const skillLevels = Object.fromEntries(ALL_SKILL_NAMES.map((name) => [name, 5]));
  const result = computeReadinessScore({
    targetRole: 'Software Developer',
    skillLevels,
    interviews: [
      makeInterview({ date: '2026-01-01', technicalPerformance: 1, communicationPerformance: 1, confidenceLevel: 1, projectExplanationPerformance: 1 }),
      makeInterview({ date: '2026-02-01', technicalPerformance: 1, communicationPerformance: 1, confidenceLevel: 1, projectExplanationPerformance: 1 }),
    ],
    patterns: [],
  });
  assert(result.score <= 15, `Poor inputs across the board produce a low score (got ${result.score})`);
}

console.log('\nBreakdown always sums correctly and every weight is accounted for');
{
  const result = computeReadinessScore({
    targetRole: 'Software Developer',
    skillLevels: Object.fromEntries(ALL_SKILL_NAMES.map((name) => [name, 70])),
    interviews: [makeInterview({}), makeInterview({ date: '2026-02-01' })],
    patterns: [],
  });
  const totalWeight = result.breakdown.reduce((sum, c) => sum + c.weight, 0);
  assert(Math.abs(totalWeight - 1) < 0.001, 'All 5 component weights sum to 1.0 (100%)');
  assert(result.breakdown.every((c) => c.value === null || (c.value >= 0 && c.value <= 100)), 'Every component value is within 0-100');
}

console.log('\nRecurring unresolved patterns reduce the score');
{
  const baseArgs = {
    targetRole: 'Software Developer',
    skillLevels: Object.fromEntries(ALL_SKILL_NAMES.map((name) => [name, 70])),
    interviews: [makeInterview({}), makeInterview({ date: '2026-02-01' })],
  };
  const withoutPatterns = computeReadinessScore({ ...baseArgs, patterns: [] });
  const withPatterns = computeReadinessScore({
    ...baseArgs,
    patterns: [
      { trend: 'increasing' },
      { trend: 'stable' },
    ],
  });
  assert(withPatterns.score < withoutPatterns.score, 'Unresolved recurring patterns lower the score');
  assert(
    withoutPatterns.score - withPatterns.score === 10,
    `Penalty is exactly 5 points per unresolved pattern (2 patterns = 10 point difference, got ${withoutPatterns.score - withPatterns.score})`
  );
}

console.log("\nAn IMPROVING pattern (trend: decreasing) is NOT penalized");
{
  const baseArgs = {
    targetRole: 'Software Developer',
    skillLevels: Object.fromEntries(ALL_SKILL_NAMES.map((name) => [name, 70])),
    interviews: [makeInterview({}), makeInterview({ date: '2026-02-01' })],
  };
  const withoutPatterns = computeReadinessScore({ ...baseArgs, patterns: [] });
  const withImprovingPattern = computeReadinessScore({
    ...baseArgs,
    patterns: [{ trend: 'decreasing' }],
  });
  assert(
    withImprovingPattern.score === withoutPatterns.score,
    "A pattern that's already improving (trend: decreasing) does not reduce the score"
  );
}

console.log('\nPenalty is capped even with many unresolved patterns');
{
  const result = computeReadinessScore({
    targetRole: 'Software Developer',
    skillLevels: Object.fromEntries(ALL_SKILL_NAMES.map((name) => [name, 70])),
    interviews: [makeInterview({}), makeInterview({ date: '2026-02-01' })],
    patterns: Array(10).fill({ trend: 'increasing' }), // would be 50 points uncapped
  });
  assert(result.penalty === 15, `Penalty is capped at 15 regardless of pattern count (got ${result.penalty})`);
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
