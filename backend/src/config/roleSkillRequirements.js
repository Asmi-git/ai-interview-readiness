/**
 * Which tracked skills (from SKILL_CATALOG) matter for each target role's
 * "role skill coverage" score. Deliberately a plain data file, not logic —
 * add a role here and it's immediately usable by the readiness score
 * without touching readinessScoreService.js.
 *
 * Roles not listed here fall back to using all technical skills as a
 * reasonable default (see readinessScoreService.js) — this list doesn't
 * need to be exhaustive to keep the app working, only to make the score
 * more precisely tailored for the roles it does cover.
 */
const ROLE_SKILL_REQUIREMENTS = {
  'Software Developer': ['Programming', 'DSA', 'OOP', 'Operating Systems', 'Computer Networks', 'DBMS'],
  'Frontend Developer': ['Programming', 'DSA', 'OOP', 'Communication', 'Project Explanation'],
  'Backend Developer': ['Programming', 'DSA', 'DBMS', 'OOP', 'Operating Systems', 'Computer Networks'],
  'Data Analyst': ['DBMS', 'Programming', 'Communication', 'Problem Explanation'],
  'Data Scientist': ['Programming', 'DBMS', 'DSA', 'Communication'],
  'QA Engineer': ['Programming', 'DSA', 'DBMS', 'Communication', 'Problem Explanation'],
  'UI/UX Designer': ['Communication', 'Project Explanation', 'Confidence', 'Problem Explanation'],
};

module.exports = { ROLE_SKILL_REQUIREMENTS };
