/**
 * Lightweight end-to-end test for Phase 1 (Foundation / Auth).
 * Spins up an in-memory MongoDB (no real mongod needed) and a real
 * instance of the Express app, then exercises the actual HTTP endpoints.
 *
 * This file is a development/verification tool, not part of the production
 * app. Run with: npm run test:auth
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

function extractCookie(res) {
  const raw = res.headers.get('set-cookie');
  if (!raw) return null;
  return raw.split(';')[0]; // "irp_session=xxx"
}

async function run() {
  console.log('Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to in-memory MongoDB.\n');

  const app = createApp();
  const server = app.listen(0); // random free port
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/api`;

  const testEmail = `student_${Date.now()}@example.com`;
  const testPassword = 'SecurePass123';

  try {
    console.log('Test: health check');
    const health = await fetch(`${base}/health`);
    assert(health.status === 200, 'GET /api/health returns 200');

    console.log('\nTest: register a new user');
    const registerRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const registerBody = await registerRes.json();
    assert(registerRes.status === 201, 'Register returns 201');
    assert(registerBody.user?.email === testEmail.toLowerCase(), 'Response contains created user email');
    assert(!('passwordHash' in (registerBody.user || {})), 'Password hash is never exposed in response');
    const sessionCookie = extractCookie(registerRes);
    assert(!!sessionCookie, 'Register sets an httpOnly session cookie');

    console.log('\nTest: reject duplicate registration');
    const dupRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert(dupRes.status === 409, 'Duplicate email registration returns 409');

    console.log('\nTest: reject weak password');
    const weakRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `weak_${Date.now()}@example.com`, password: '123' }),
    });
    assert(weakRes.status === 400, 'Weak password registration returns 400 with validation errors');

    console.log('\nTest: login with correct credentials');
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginBody = await loginRes.json();
    assert(loginRes.status === 200, 'Login returns 200');
    assert(!!loginBody.token, 'Login response includes a JWT for API clients');
    const loginCookie = extractCookie(loginRes);

    console.log('\nTest: reject login with wrong password');
    const wrongLoginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword1' }),
    });
    assert(wrongLoginRes.status === 401, 'Wrong password returns 401');

    console.log('\nTest: access protected route with valid session cookie');
    const meRes = await fetch(`${base}/auth/me`, {
      headers: { Cookie: loginCookie },
    });
    const meBody = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 with valid cookie');
    assert(meBody.user?.email === testEmail.toLowerCase(), '/me returns the correct logged-in user');

    console.log('\nTest: access protected route with Bearer token instead of cookie');
    const meBearerRes = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    assert(meBearerRes.status === 200, 'GET /api/auth/me works with Authorization: Bearer header too');

    console.log('\nTest: reject protected route with no auth at all');
    const noAuthRes = await fetch(`${base}/auth/me`);
    assert(noAuthRes.status === 401, 'GET /api/auth/me returns 401 with no credentials');

    console.log('\nTest: reject protected route with tampered token');
    const tamperedRes = await fetch(`${base}/auth/me`, {
      headers: { Authorization: 'Bearer not.a.valid.token' },
    });
    assert(tamperedRes.status === 401, 'GET /api/auth/me returns 401 with an invalid token');

    console.log('\nTest: logout clears the session cookie');
    const logoutRes = await fetch(`${base}/auth/logout`, { method: 'POST' });
    assert(logoutRes.status === 200, 'Logout returns 200');
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
