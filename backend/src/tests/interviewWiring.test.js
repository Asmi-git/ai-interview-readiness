/**
 * Wiring + validation tests for Phase 3 (Interview Records) that don't
 * require a live database connection.
 * Run with: node src/tests/interviewWiring.test.js
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.COOKIE_NAME = 'irp_session';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';

const jwt = require('jsonwebtoken');
const createApp = require('../app');

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

async function run() {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/api`;
  const fakeToken = jwt.sign({ id: '64f0c8f1a1b2c3d4e5f6a7b8' }, process.env.JWT_SECRET);
  const authHeader = { Authorization: `Bearer ${fakeToken}` };

  try {
    console.log('Meta options now include interview-related lists');
    const metaRes = await fetch(`${base}/meta/options`);
    const metaBody = await metaRes.json();
    assert(Array.isArray(metaBody.interviewTypes) && metaBody.interviewTypes.length > 0, 'interviewTypes present');
    assert(Array.isArray(metaBody.struggleAreas) && metaBody.struggleAreas.length > 0, 'struggleAreas present');
    assert(metaBody.interviewResults?.includes('selected'), 'interviewResults includes "selected"');
    assert(
      Array.isArray(metaBody.struggleReasons) && metaBody.struggleReasons.length === 8,
      'struggleReasons present with all 8 reasons'
    );

    console.log('\nAll interview routes require auth');
    assert((await fetch(`${base}/interviews`)).status === 401, 'GET /api/interviews returns 401 with no credentials');
    assert(
      (await fetch(`${base}/interviews`, { method: 'POST' })).status === 401,
      'POST /api/interviews returns 401 with no credentials'
    );
    assert(
      (await fetch(`${base}/interviews/64f0c8f1a1b2c3d4e5f6a7b8`)).status === 401,
      'GET /api/interviews/:id returns 401 with no credentials'
    );

    console.log('\nValidation runs before touching the database');
    const badCreate = await fetch(`${base}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({}),
    });
    const badCreateBody = await badCreate.json();
    assert(badCreate.status === 400, 'Empty interview payload returns 400');
    assert(badCreateBody.errors?.length >= 8, 'Validation lists every missing required field');

    const badEnum = await fetch(`${base}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        companyName: 'Acme Corp',
        date: '2026-05-01',
        targetRole: 'Frontend Developer',
        interviewType: 'Not A Real Type',
        interviewRound: 'Round 1',
        result: 'maybe', // invalid enum value
        technicalPerformance: 9, // out of range
        communicationPerformance: 3,
        confidenceLevel: 3,
        projectExplanationPerformance: 3,
        struggleAreas: ['Not A Real Struggle'],
        struggleReasons: ['Not A Real Reason'],
      }),
    });
    const badEnumBody = await badEnum.json();
    assert(badEnum.status === 400, 'Invalid enum values (type/result) return 400');
    assert(badEnumBody.errors?.length >= 3, 'Reports invalid interviewType, result, out-of-range rating, and bad struggle area');

    const badId = await fetch(`${base}/interviews/not-a-valid-id`, { headers: authHeader });
    assert(badId.status === 400, 'Malformed interview id returns 400, not a 500 crash');
  } finally {
    server.close();
  }

  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
