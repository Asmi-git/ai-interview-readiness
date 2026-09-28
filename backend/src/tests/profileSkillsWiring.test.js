/**
 * Wiring + validation tests for Phase 2 (Profile & Skills) that don't
 * require a live database connection.
 * Run with: node src/tests/profileSkillsWiring.test.js
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
    console.log('Meta options endpoint (public, no auth)');
    const metaRes = await fetch(`${base}/meta/options`);
    const metaBody = await metaRes.json();
    assert(metaRes.status === 200, 'GET /api/meta/options returns 200 without auth');
    assert(Array.isArray(metaBody.targetRoles) && metaBody.targetRoles.length > 0, 'Returns a non-empty target role list');
    assert(
      Array.isArray(metaBody.skillCatalog?.technical) && Array.isArray(metaBody.skillCatalog?.soft),
      'Returns a skill catalog with technical and soft categories'
    );

    console.log('\nProfile routes require auth');
    const profileNoAuth = await fetch(`${base}/profile`);
    assert(profileNoAuth.status === 401, 'GET /api/profile returns 401 with no credentials');

    const profilePutNoAuth = await fetch(`${base}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    assert(profilePutNoAuth.status === 401, 'PUT /api/profile returns 401 with no credentials');

    console.log('\nSkill routes require auth');
    const skillsNoAuth = await fetch(`${base}/skills`);
    assert(skillsNoAuth.status === 401, 'GET /api/skills returns 401 with no credentials');

    console.log('\nProfile validation (behind a fake valid token so we reach the validators)');
    const jwt = require('jsonwebtoken');
    const fakeToken = jwt.sign({ id: '64f0c8f1a1b2c3d4e5f6a7b8' }, process.env.JWT_SECRET);

    const badProfile = await fetch(`${base}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fakeToken}` },
      body: JSON.stringify({ name: '', education: 'Not A Real Level', degree: '', experienceLevel: '', targetRole: '' }),
    });
    const badProfileBody = await badProfile.json();
    assert(badProfile.status === 400, 'Invalid profile payload returns 400 before touching the database');
    assert(badProfileBody.errors?.length >= 4, 'Validation lists all missing/invalid fields');

    console.log('\nSkill validation (behind a fake valid token)');
    const badSkills = await fetch(`${base}/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fakeToken}` },
      body: JSON.stringify({ skills: [{ skillName: 'NotARealSkill', level: 150 }] }),
    });
    const badSkillsBody = await badSkills.json();
    assert(badSkills.status === 400, 'Unknown skill name + out-of-range level returns 400');
    assert(badSkillsBody.errors?.length === 2, 'Validation reports both the bad skill name and the bad level');

    const emptySkills = await fetch(`${base}/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fakeToken}` },
      body: JSON.stringify({ skills: [] }),
    });
    assert(emptySkills.status === 400, 'Empty skills array is rejected');
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
