/**
 * End-to-end test for Phase 5. This is the big one: it spins up an
 * in-memory MongoDB AND the real Python AI service as a child process,
 * then exercises the full loop through the real Node app — create
 * interviews, confirm patterns get detected and persisted, confirm
 * recommendations get generated, dismiss one, delete an interview, and
 * confirm everything updates correctly.
 *
 * Run with: npm run test:patterns:e2e
 * Requires: MongoDB binary download (like other *:e2e tests) AND a Python
 * environment with the ai-service's dependencies installed
 * (see ai-service/requirements.txt).
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.COOKIE_NAME = 'irp_session';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';

const path = require('path');
const { spawn } = require('child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

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

function startAiService(port) {
  return new Promise((resolve, reject) => {
    const aiServiceDir = path.join(__dirname, '..', '..', '..', 'ai-service');
    const proc = spawn('python3', ['-m', 'uvicorn', 'app.main:app', '--port', String(port)], {
      cwd: aiServiceDir,
      env: { ...process.env },
    });

    let ready = false;
    const onData = (data) => {
      if (!ready && data.toString().includes('Application startup complete')) {
        ready = true;
        resolve(proc);
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('error', reject);

    setTimeout(() => {
      if (!ready) reject(new Error('AI service did not start within 15s'));
    }, 15000);
  });
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

const baseInterview = (overrides) => ({
  companyName: 'Acme Corp',
  targetRole: 'Frontend Developer',
  interviewType: 'Technical',
  interviewRound: 'Round 1',
  result: 'rejected',
  technicalPerformance: 2,
  communicationPerformance: 3,
  confidenceLevel: 3,
  projectExplanationPerformance: 3,
  struggleAreas: [],
  ...overrides,
});

async function run() {
  const aiPort = 8123;
  process.env.AI_SERVICE_URL = `http://localhost:${aiPort}`;

  console.log('Starting real AI service (Python)...');
  const aiProcess = await startAiService(aiPort);
  console.log('AI service ready.\n');

  let mongod;
  let server;

  try {
    console.log('Starting in-memory MongoDB...');
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('Connected.\n');

    // Required after AI_SERVICE_URL is set and before app.js's dependent
    // modules are cached with the wrong URL.
    delete require.cache[require.resolve('../services/aiServiceClient')];
    delete require.cache[require.resolve('../services/patternAnalysisService')];
    delete require.cache[require.resolve('../controllers/interviewController')];
    delete require.cache[require.resolve('../routes/interviewRoutes')];
    delete require.cache[require.resolve('../app')];
    const createApp = require('../app');

    const app = createApp();
    server = app.listen(0);
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}/api`;

    const token = await registerUser(base, `student_${Date.now()}@example.com`);
    const auth = { Authorization: `Bearer ${token}` };

    console.log('Log 5 interviews matching the spec scenario (DBMS x3, Confidence x2)');
    const descriptions = [
      'I struggled with SQL joins.',
      'I could not answer database questions.',
      'Unable to explain normalization when asked.',
      'I felt very nervous answering HR questions about myself.',
      'I lacked confidence while speaking during the HR round.',
    ];
    const tags = [['DBMS'], ['DSA'], [], ['HR questions'], ['Confidence']];
    let lastInterviewId;
    for (let i = 0; i < descriptions.length; i++) {
      const res = await fetch(`${base}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(
          baseInterview({
            date: `2026-0${i + 4}-0${i + 1}`,
            description: descriptions[i],
            struggleAreas: tags[i],
          })
        ),
      });
      const body = await res.json();
      assert(res.status === 201, `Interview ${i + 1} created`);
      lastInterviewId = body.interview._id;
    }

    console.log('\nPatterns reflect the real AI service analysis');
    const patternsRes = await fetch(`${base}/patterns`, { headers: auth });
    const patternsBody = await patternsRes.json();
    const byCategory = Object.fromEntries(patternsBody.patterns.map((p) => [p.category, p]));

    assert(byCategory['DBMS/SQL']?.frequency === 3, 'DBMS/SQL pattern detected with frequency 3');
    assert(byCategory['Confidence']?.frequency === 2, 'Confidence pattern detected with frequency 2');

    console.log('\nRecommendations were generated from the detected patterns');
    const recsRes = await fetch(`${base}/recommendations`, { headers: auth });
    const recsBody = await recsRes.json();
    const dbmsRec = recsBody.recommendations.find((r) => r.patternCategory === 'DBMS/SQL');
    assert(!!dbmsRec, 'A recommendation exists for the DBMS/SQL pattern');
    assert(dbmsRec.recommendationText.length > 20, 'Recommendation has real generated text, not empty');
    assert(dbmsRec.priority === 'high', 'DBMS/SQL (frequency 3, no prior trend data) gets a sensible priority');

    console.log('\nDismissing a recommendation removes it from the active list');
    await fetch(`${base}/recommendations/${dbmsRec._id}/dismiss`, { method: 'PUT', headers: auth });
    const afterDismissRes = await fetch(`${base}/recommendations`, { headers: auth });
    const afterDismissBody = await afterDismissRes.json();
    assert(
      !afterDismissBody.recommendations.some((r) => r._id === dbmsRec._id),
      'Dismissed recommendation no longer appears in the active list'
    );

    console.log('\nDeleting an interview triggers re-analysis');
    await fetch(`${base}/interviews/${lastInterviewId}`, { method: 'DELETE', headers: auth });
    const afterDeleteRes = await fetch(`${base}/patterns`, { headers: auth });
    const afterDeleteBody = await afterDeleteRes.json();
    const confidenceAfterDelete = afterDeleteBody.patterns.find((p) => p.category === 'Confidence');
    assert(
      !confidenceAfterDelete,
      'Confidence pattern (frequency 2) disappears after deleting one of its 2 contributing interviews'
    );
  } finally {
    if (server) server.close();
    if (mongod) {
      await mongoose.disconnect();
      await mongod.stop();
    }
    aiProcess.kill();
  }

  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
