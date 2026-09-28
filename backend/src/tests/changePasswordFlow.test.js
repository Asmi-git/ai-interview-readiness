/**
 * End-to-end test for change-password: register -> change with correct
 * current password -> old password no longer works -> new password does.
 * Also confirms wrong current password is rejected without changing anything.
 *
 * Run with: npm run test:change-password:e2e
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.COOKIE_NAME = 'irp_session';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
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
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/api`;

  const email = `student_${Date.now()}@example.com`;
  const originalPassword = 'OriginalPass123';
  const newPassword = 'BrandNewPass456';

  try {
    const registerRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: originalPassword }),
    });
    const { token } = await registerRes.json();
    const auth = { Authorization: `Bearer ${token}` };

    console.log('Reject change with wrong current password');
    const wrongCurrent = await fetch(`${base}/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ currentPassword: 'NotTheRealPassword', newPassword }),
    });
    assert(wrongCurrent.status === 401, 'Wrong current password returns 401');

    console.log('\nOriginal password still works after a failed attempt');
    const loginStillWorks = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: originalPassword }),
    });
    assert(loginStillWorks.status === 200, 'Login with original password still succeeds (failed attempt changed nothing)');

    console.log('\nChange password with the correct current password');
    const changeRes = await fetch(`${base}/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ currentPassword: originalPassword, newPassword }),
    });
    assert(changeRes.status === 200, 'Correct current password allows the change');

    console.log('\nOld password no longer works');
    const oldLoginFails = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: originalPassword }),
    });
    assert(oldLoginFails.status === 401, 'Login with the OLD password now fails');

    console.log('\nNew password works');
    const newLoginWorks = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword }),
    });
    assert(newLoginWorks.status === 200, 'Login with the NEW password succeeds');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
  }

  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
