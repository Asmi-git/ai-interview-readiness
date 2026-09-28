/**
 * Single source of truth for target roles and the tracked skill catalog.
 * The frontend fetches these via GET /api/meta/options instead of
 * hardcoding its own copy, so adding a new role or skill later means
 * editing only this file.
 */

const TARGET_ROLES = [
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Analyst',
  'Data Scientist',
  'QA Engineer',
  'UI/UX Designer',
];

const EXPERIENCE_LEVELS = ['Student', 'Fresher (0 years)', '1-2 years', '3+ years'];

const EDUCATION_LEVELS = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", 'PhD'];

// Keys must stay stable — they're used as skillName values in the Skills collection.
const SKILL_CATALOG = {
  technical: ['Programming', 'DSA', 'DBMS', 'OOP', 'Operating Systems', 'Computer Networks'],
  soft: ['Communication', 'Confidence', 'Problem Explanation', 'Project Explanation'],
};

const ALL_SKILL_NAMES = [...SKILL_CATALOG.technical, ...SKILL_CATALOG.soft];

const INTERVIEW_TYPES = [
  'Technical',
  'HR',
  'Managerial',
  'Group Discussion',
  'Online Assessment / Coding Test',
];

const INTERVIEW_RESULTS = ['selected', 'rejected', 'pending'];

// Multi-select tags for "which areas did you struggle with" — deliberately
// broad and non-technical-jargon so users can self-report without needing
// to already know the precise cause of a rejection.
const STRUGGLE_AREAS = [
  'Technical questions',
  'Coding',
  'DBMS',
  'DSA',
  'Communication',
  'Confidence',
  'Project explanation',
  'HR questions',
  'Problem solving',
  'Other',
];

// A second, orthogonal axis: WHY the struggle happened, independent of
// WHAT topic it was about. E.g. a DBMS struggle could be "didn't know the
// concept" or "became nervous" — very different root causes, very
// different fixes. This is what makes recommendations explainable rather
// than generic ("improve DBMS" vs "you specifically forgot concepts you'd
// studied, so the fix is spaced revision, not first-time learning").
const STRUGGLE_REASONS = [
  "Didn't know the concept",
  'Forgot the answer',
  "Couldn't apply the concept",
  'Ran out of time',
  "Couldn't explain clearly",
  'Became nervous',
  "Couldn't organize the answer",
  "Didn't understand the question",
];

module.exports = {
  TARGET_ROLES,
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
  SKILL_CATALOG,
  ALL_SKILL_NAMES,
  INTERVIEW_TYPES,
  INTERVIEW_RESULTS,
  STRUGGLE_AREAS,
  STRUGGLE_REASONS,
};
