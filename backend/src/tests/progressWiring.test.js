/**
 * Wiring test for Phase 8 (Progress) that doesn't require a live database.
 * Run with: node src/tests/progressWiring.test.js
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.COOKIE_NAME = 'irp_session';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';

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

  try {
    assert(
      (await fetch(`${base}/progress/monthly`)).status === 401,
      'GET /api/progress/monthly returns 401 with no credentials'
    );
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
