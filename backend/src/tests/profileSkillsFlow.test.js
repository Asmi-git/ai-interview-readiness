/**
 * End-to-end test for Phase 2 (Profile & Skills). Spins up an in-memory
 * MongoDB and a real instance of the Express app, then exercises the
 * actual HTTP endpoints across register -> profile -> skills.
 *
 * Run with: npm run test:profile-skills:e2e
 * (Requires internet access the first time, to download the MongoDB binary
 * mongodb-memory-server manages automatically.)
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
  console.log('Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('Connected.\n');

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/api`;

  const email = `student_${Date.now()}@example.com`;
  const password = 'SecurePass123';
  let token;

  try {
    console.log('Register + get token');
    const registerRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const registerBody = await registerRes.json();
    token = registerBody.token;
    assert(registerRes.status === 201 && !!token, 'Register succeeds and returns a usable token');

    console.log('\nProfile: empty state before anything is saved');
    const emptyProfileRes = await fetch(`${base}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const emptyProfileBody = await emptyProfileRes.json();
    assert(emptyProfileRes.status === 200, 'GET /api/profile returns 200 even with no profile yet');
    assert(emptyProfileBody.profile === null, 'Profile is null (not an error) before the user has saved one');

    console.log('\nProfile: create');
    const createProfileRes = await fetch(`${base}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Asha Kumar',
        education: "Bachelor's Degree",
        degree: 'B.Tech Computer Science',
        experienceLevel: 'Student',
        targetRole: 'Frontend Developer',
        preferredIndustry: 'Product companies',
        skills: ['React', 'JavaScript'],
        careerGoal: 'Land a frontend role at a product company',
      }),
    });
    const createProfileBody = await createProfileRes.json();
    assert(createProfileRes.status === 200, 'PUT /api/profile creates a new profile (200)');
    assert(createProfileBody.profile?.name === 'Asha Kumar', 'Created profile reflects submitted data');

    console.log('\nProfile: fetch after creation reflects saved data');
    const fetchedProfileRes = await fetch(`${base}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fetchedProfileBody = await fetchedProfileRes.json();
    assert(fetchedProfileBody.profile?.targetRole === 'Frontend Developer', 'GET reflects the saved target role');
    assert(fetchedProfileBody.profile?.skills?.includes('React'), 'GET reflects saved free-text skill tags');

    console.log('\nProfile: update (upsert, not duplicate)');
    const updateProfileRes = await fetch(`${base}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Asha Kumar',
        education: "Bachelor's Degree",
        degree: 'B.Tech Computer Science',
        experienceLevel: '1-2 years',
        targetRole: 'Frontend Developer',
      }),
    });
    const updateProfileBody = await updateProfileRes.json();
    assert(updateProfileBody.profile?.experienceLevel === '1-2 years', 'Second save updates the existing profile');

    console.log('\nSkills: empty state before anything is rated');
    const emptySkillsRes = await fetch(`${base}/skills`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const emptySkillsBody = await emptySkillsRes.json();
    const dsaEntry = emptySkillsBody.skills?.find((s) => s.skillName === 'DSA');
    assert(dsaEntry?.level === null, 'Unrated skills come back as level: null, not 0');

    console.log('\nSkills: save levels');
    const saveSkillsRes = await fetch(`${base}/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        skills: [
          { skillName: 'DSA', level: 60 },
          { skillName: 'Communication', level: 75 },
        ],
      }),
    });
    assert(saveSkillsRes.status === 200, 'PUT /api/skills saves successfully');

    console.log('\nSkills: fetch reflects the latest saved levels');
    const fetchedSkillsRes = await fetch(`${base}/skills`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fetchedSkillsBody = await fetchedSkillsRes.json();
    const dsaAfter = fetchedSkillsBody.skills.find((s) => s.skillName === 'DSA');
    const commAfter = fetchedSkillsBody.skills.find((s) => s.skillName === 'Communication');
    assert(dsaAfter.level === 60, 'DSA level reflects the saved value');
    assert(commAfter.level === 75, 'Communication level reflects the saved value');
    assert(dsaAfter.category === 'technical', 'DSA is correctly categorized as technical');
    assert(commAfter.category === 'soft', 'Communication is correctly categorized as soft');

    console.log('\nSkills: re-saving updates the "latest" value (append-only history, not overwritten)');
    await fetch(`${base}/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ skills: [{ skillName: 'DSA', level: 80 }] }),
    });
    const afterSecondSaveRes = await fetch(`${base}/skills`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const afterSecondSaveBody = await afterSecondSaveRes.json();
    const dsaLatest = afterSecondSaveBody.skills.find((s) => s.skillName === 'DSA');
    assert(dsaLatest.level === 80, 'Latest DSA save (80) is what GET returns, not the earlier value (60)');
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
