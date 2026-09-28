/**
 * Unit tests for Phase 1 pieces that don't require a live MongoDB connection:
 * password hashing, JWT signing/verification, and input validation rules.
 *
 * (Full end-to-end DB tests live in authFlow.test.js and require a reachable
 * MongoDB instance - either local `mongod` or mongodb-memory-server with
 * internet access to download the binary once.)
 *
 * Run with: node src/tests/authUnit.test.js
 */
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.COOKIE_NAME = 'irp_session';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { signToken } = require('../services/tokenService');

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

async function testPasswordHashing() {
  console.log('\nPassword hashing (bcryptjs)');
  const plain = 'SecurePass123';
  const hash = await bcrypt.hash(plain, 12);

  assert(hash !== plain, 'Hash is never equal to the plaintext password');
  assert(await bcrypt.compare(plain, hash), 'Correct password matches its hash');
  assert(!(await bcrypt.compare('WrongPassword', hash)), 'Wrong password does not match the hash');

  const hash2 = await bcrypt.hash(plain, 12);
  assert(hash !== hash2, 'Hashing the same password twice produces different hashes (salted)');
}

function testJwt() {
  console.log('\nJWT token service');
  const fakeUserId = '64f0c8f1a1b2c3d4e5f6a7b8';
  const token = signToken(fakeUserId);

  assert(typeof token === 'string' && token.split('.').length === 3, 'Token is a well-formed JWT');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert(decoded.id === fakeUserId, 'Decoded token contains the correct user id');

  let rejectedTamperedSecret = false;
  try {
    jwt.verify(token, 'wrong-secret');
  } catch {
    rejectedTamperedSecret = true;
  }
  assert(rejectedTamperedSecret, 'Token verification fails with the wrong secret');

  const expiredToken = jwt.sign({ id: fakeUserId }, process.env.JWT_SECRET, { expiresIn: '-1s' });
  let rejectedExpired = false;
  try {
    jwt.verify(expiredToken, process.env.JWT_SECRET);
  } catch (err) {
    rejectedExpired = err.name === 'TokenExpiredError';
  }
  assert(rejectedExpired, 'Expired tokens are correctly rejected');
}

async function runValidators(validators, body) {
  const req = { body };
  for (const validator of validators) {
    await validator.run(req);
  }
  return validationResult(req);
}

async function testValidators() {
  console.log('\nInput validation rules');
  // Re-require here so route wiring (which needs Express) is not required for this test.
  const { body } = require('express-validator');

  const registerValidators = [
    body('email').isEmail().withMessage('A valid email address is required.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
      .matches(/\d/)
      .withMessage('Password must contain at least one number.'),
  ];

  const goodResult = await runValidators(registerValidators, {
    email: 'student@example.com',
    password: 'SecurePass123',
  });
  assert(goodResult.isEmpty(), 'Valid email + strong password passes validation');

  const badEmailResult = await runValidators(registerValidators, {
    email: 'not-an-email',
    password: 'SecurePass123',
  });
  assert(!badEmailResult.isEmpty(), 'Malformed email is rejected');

  const shortPasswordResult = await runValidators(registerValidators, {
    email: 'student@example.com',
    password: 'short1',
  });
  assert(!shortPasswordResult.isEmpty(), 'Password under 8 characters is rejected');

  const noDigitResult = await runValidators(registerValidators, {
    email: 'student@example.com',
    password: 'nodigitshere',
  });
  assert(!noDigitResult.isEmpty(), 'Password without a digit is rejected');
}

async function run() {
  await testPasswordHashing();
  testJwt();
  await testValidators();

  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
