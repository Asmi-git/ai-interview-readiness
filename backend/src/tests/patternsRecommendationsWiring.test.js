/**
 * Wiring + validation tests for Phase 5 (Patterns & Recommendations) that
 * don't require a live database connection.
 * Run with: node src/tests/patternsRecommendationsWiring.test.js
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
    console.log('Patterns and recommendations require auth');
    assert((await fetch(`${base}/patterns`)).status === 401, 'GET /api/patterns returns 401 with no credentials');
    assert(
      (await fetch(`${base}/recommendations`)).status === 401,
      'GET /api/recommendations returns 401 with no credentials'
    );
    assert(
      (await fetch(`${base}/recommendations/64f0c8f1a1b2c3d4e5f6a7b8/dismiss`, { method: 'PUT' })).status === 401,
      'PUT /api/recommendations/:id/dismiss returns 401 with no credentials'
    );

    console.log('\nDismiss route validates the id before touching the database');
    const badId = await fetch(`${base}/recommendations/not-a-valid-id/dismiss`, {
      method: 'PUT',
      headers: authHeader,
    });
    assert(badId.status === 400, 'Malformed recommendation id returns 400, not a 500 crash');
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
