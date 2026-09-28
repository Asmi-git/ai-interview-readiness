/**
 * Smoke test for Express app wiring: confirms routes, CORS, cookie parsing,
 * auth middleware, and the 404/error handlers are all connected correctly.
 * Does not require a database - only /api/auth/me (protected route) and
 * /api/health (no DB dependency) are exercised here.
 *
 * Run with: node src/tests/appWiring.test.js
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
  const base = `http://127.0.0.1:${port}`;

  try {
    const health = await fetch(`${base}/api/health`);
    assert(health.status === 200, 'GET /api/health responds without needing a DB connection');

    const corsRes = await fetch(`${base}/api/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert(
      corsRes.headers.get('access-control-allow-origin') === 'http://localhost:3000',
      'CORS allows the configured frontend origin'
    );

    const unknownRoute = await fetch(`${base}/api/this-route-does-not-exist`);
    const unknownBody = await unknownRoute.json();
    assert(unknownRoute.status === 404, 'Unknown routes return 404');
    assert(unknownBody.success === false, '404 response follows the standard { success: false } shape');

    const protectedNoAuth = await fetch(`${base}/api/auth/me`);
    assert(protectedNoAuth.status === 401, 'Protected route rejects requests with no credentials');

    const protectedBadToken = await fetch(`${base}/api/auth/me`, {
      headers: { Authorization: 'Bearer garbage.token.value' },
    });
    assert(protectedBadToken.status === 401, 'Protected route rejects a malformed bearer token');

    const missingBodyRegister = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const missingBodyJson = await missingBodyRegister.json();
    assert(missingBodyRegister.status === 400, 'Register with empty body returns 400');
    assert(
      Array.isArray(missingBodyJson.errors) && missingBodyJson.errors.length >= 2,
      'Validation errors list both missing email and missing password'
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
