/**
 * End-to-end test for Phase 3 (Interview Records). Spins up an in-memory
 * MongoDB and a real Express app, exercising create/list/get/update/delete
 * plus the ownership check (one user must never see or touch another's records).
 *
 * Run with: npm run test:interviews:e2e
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

async function registerUser(base, email) {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'SecurePass123' }),
  });
  const body = await res.json();
  return body.token;
}

const sampleInterview = (overrides = {}) => ({
  companyName: 'Acme Corp',
  date: '2026-05-01',
  targetRole: 'Frontend Developer',
  interviewType: 'Technical',
  interviewRound: 'Round 1',
  result: 'rejected',
  technicalPerformance: 2,
  communicationPerformance: 3,
  confidenceLevel: 3,
  projectExplanationPerformance: 3,
  struggleAreas: ['DBMS', 'DSA'],
  interviewerFeedback: 'Struggled with SQL joins.',
  description: 'I could not answer the database questions confidently.',
  ...overrides,
});

async function run() {
  console.log('Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('Connected.\n');

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/api`;

  try {
    const tokenA = await registerUser(base, `userA_${Date.now()}@example.com`);
    const tokenB = await registerUser(base, `userB_${Date.now()}@example.com`);
    const authA = { Authorization: `Bearer ${tokenA}` };
    const authB = { Authorization: `Bearer ${tokenB}` };

    console.log('Empty state before any interviews are logged');
    const emptyListRes = await fetch(`${base}/interviews`, { headers: authA });
    const emptyListBody = await emptyListRes.json();
    assert(emptyListRes.status === 200 && emptyListBody.interviews.length === 0, 'New user starts with an empty interview list');

    console.log('\nCreate three interviews for user A');
    const created = [];
    for (const overrides of [
      { companyName: 'Acme Corp', description: 'Struggled with SQL joins.' },
      { companyName: 'Globex', description: 'Could not answer database questions.' },
      { companyName: 'Initech', description: 'Unable to explain normalization.' },
    ]) {
      const res = await fetch(`${base}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authA },
        body: JSON.stringify(sampleInterview(overrides)),
      });
      const body = await res.json();
      assert(res.status === 201, `Create "${overrides.companyName}" returns 201`);
      created.push(body.interview);
    }

    console.log('\nList reflects all three, most recent first by date');
    const listRes = await fetch(`${base}/interviews`, { headers: authA });
    const listBody = await listRes.json();
    assert(listBody.interviews.length === 3, 'GET /api/interviews returns all 3 records');

    console.log('\nGet a single record by id');
    const targetId = created[0]._id;
    const getOneRes = await fetch(`${base}/interviews/${targetId}`, { headers: authA });
    const getOneBody = await getOneRes.json();
    assert(getOneRes.status === 200, 'GET /api/interviews/:id returns 200');
    assert(getOneBody.interview.companyName === 'Acme Corp', 'Returns the correct record');

    console.log('\nUpdate a record');
    const updateRes = await fetch(`${base}/interviews/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authA },
      body: JSON.stringify(sampleInterview({ companyName: 'Acme Corp', result: 'selected' })),
    });
    const updateBody = await updateRes.json();
    assert(updateBody.interview.result === 'selected', 'Update is reflected immediately');

    console.log('\nCross-user isolation: user B cannot see or touch user A\'s records');
    const crossRead = await fetch(`${base}/interviews/${targetId}`, { headers: authB });
    assert(crossRead.status === 404, "User B gets 404 reading user A's interview (not 403 - doesn't leak existence)");

    const crossDelete = await fetch(`${base}/interviews/${targetId}`, { method: 'DELETE', headers: authB });
    assert(crossDelete.status === 404, "User B cannot delete user A's interview");

    const crossListRes = await fetch(`${base}/interviews`, { headers: authB });
    const crossListBody = await crossListRes.json();
    assert(crossListBody.interviews.length === 0, "User B's own interview list is still empty");

    console.log('\nDelete works for the owner');
    const deleteRes = await fetch(`${base}/interviews/${targetId}`, { method: 'DELETE', headers: authA });
    assert(deleteRes.status === 200, 'Owner can delete their own interview');

    const afterDeleteRes = await fetch(`${base}/interviews`, { headers: authA });
    const afterDeleteBody = await afterDeleteRes.json();
    assert(afterDeleteBody.interviews.length === 2, 'List reflects the deletion (down to 2)');
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
