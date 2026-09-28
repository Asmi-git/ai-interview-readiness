/**
 * Wiring + validation tests for the change-password endpoint (Settings
 * page). Run with: node src/tests/changePassword.test.js
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
    console.log('Requires auth');
    const noAuth = await fetch(`${base}/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'x', newPassword: 'NewPass123' }),
    });
    assert(noAuth.status === 401, 'PUT /api/auth/password returns 401 with no credentials');

    console.log('\nValidation runs before touching the database');
    const missingFields = await fetch(`${base}/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({}),
    });
    assert(missingFields.status === 400, 'Empty body returns 400');

    const weakNewPassword = await fetch(`${base}/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ currentPassword: 'whatever', newPassword: 'short' }),
    });
    const weakBody = await weakNewPassword.json();
    assert(weakNewPassword.status === 400, 'Weak new password returns 400');
    assert(
      weakBody.errors?.some((e) => e.field === 'newPassword'),
      'Validation error is attributed to the newPassword field'
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
