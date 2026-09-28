/**
 * Structured recommendation knowledge base, keyed by category then
 * priority. Deliberately NOT another ML model — recommendations should be
 * explainable and easy to expand, so this stays a plain, editable object.
 * Add a new category or tune wording here; recommendationEngine.js picks
 * which entry to use based on the pattern's frequency and trend.
 */
const RECOMMENDATION_TEXTS = {
  'DBMS/SQL': {
    high: 'Database and SQL questions are showing up as a strong recurring weakness. Prioritize practicing SQL joins, normalization, and indexing on a free platform like SQLZoo or HackerRank SQL before your next interview.',
    medium: 'DBMS/SQL concepts have come up as a recurring theme. Spend focused time revisiting joins, normalization, and transactions — a few structured practice sessions should meaningfully improve this.',
    low: 'DBMS/SQL has appeared a couple of times. A quick refresher on core concepts (joins, normalization) should be enough to close this gap.',
  },
  DSA: {
    high: 'Data structures and algorithms are a strong recurring weakness across your interviews. Dedicate consistent daily practice to core patterns (arrays, trees, recursion) on a platform like LeetCode, starting with easy/medium problems.',
    medium: 'DSA questions have come up more than once. Regular practice on core data structures and common patterns should help close this gap before your next interview.',
    low: 'DSA has come up a couple of times. A light review of core data structures should help.',
  },
  Coding: {
    high: 'Coding/implementation questions are a recurring weak point. Practice writing clean, working code under time pressure — timed mock coding rounds will help more than untimed practice at this stage.',
    medium: 'Coding rounds have been a recurring challenge. More timed practice, especially on translating a plan into working code, should help.',
    low: 'Coding has come up a couple of times — a bit more practice under time pressure should help.',
  },
  Communication: {
    high: 'Communication is a strong recurring weakness across your interviews. Practice explaining technical concepts out loud, ideally to someone non-technical, and consider recording yourself to review clarity and pacing.',
    medium: 'Communication has come up as a recurring theme. Practice structuring your answers (situation → action → result) and explaining concepts clearly and concisely.',
    low: 'Communication has come up a couple of times. A little extra practice explaining your thinking out loud should help.',
  },
  Confidence: {
    high: 'Confidence appears to be a recurring weakness across your recent interviews. Practice explaining your projects using a structured 2-minute explanation and perform mock HR discussions to build comfort under pressure.',
    medium: 'Confidence has come up more than once. Mock interviews with a friend or mentor, focused specifically on staying composed, should help build this up.',
    low: 'Confidence has come up a couple of times — a little more mock-interview practice should help it fade.',
  },
  'Project explanation': {
    high: "Explaining your projects clearly is a recurring weak point. Prepare a tight, structured 2-minute walkthrough of each major project (problem → your role → approach → outcome) and rehearse it out loud several times.",
    medium: 'Project explanations have come up as a recurring theme. Tighten your walkthrough structure and practice explaining the "why" behind your technical decisions, not just the "what".',
    low: 'Project explanation has come up a couple of times. A bit more rehearsal of your walkthrough should help.',
  },
  'HR questions': {
    high: 'HR/behavioral questions are a recurring weak point. Prepare structured answers (using a framework like STAR) for common questions — strengths, weaknesses, "tell me about yourself" — and rehearse them out loud.',
    medium: 'HR questions have come up more than once. A bit more preparation with structured answers should help you feel more ready.',
    low: 'HR questions have come up a couple of times. A quick review of common questions should help.',
  },
  'Problem solving': {
    high: 'Problem-solving approach is a recurring weak point. Practice thinking out loud and structuring your approach before jumping to a solution — interviewers weigh your process as much as the final answer.',
    medium: 'Problem-solving has come up as a recurring theme. Practicing a clear, structured approach (clarify → plan → solve → verify) should help.',
    low: 'Problem-solving has come up a couple of times. A little more structured practice should help.',
  },
  'Technical questions': {
    high: 'General technical fundamentals are a recurring weak point. Revisit core CS fundamentals (OS, networks, OOP) with a structured study plan rather than only role-specific topics.',
    medium: 'Technical fundamentals have come up as a recurring theme. A focused review of core concepts should help close this gap.',
    low: 'Technical fundamentals have come up a couple of times. A quick refresher should help.',
  },
};

const GENERIC_TEMPLATE = {
  high: (category, frequency) =>
    `"${category}" is showing up as a strong recurring theme across ${frequency} of your interviews. Review your notes from these interviews closely to understand the root cause and address it before your next interview.`,
  medium: (category, frequency) =>
    `"${category}" has come up across ${frequency} of your interviews. Worth reviewing what happened in each case to see if there's a common thread to work on.`,
  low: (category, frequency) =>
    `"${category}" has come up a couple of times. Keep an eye on it in upcoming interviews.`,
};

const IMPROVEMENT_TEMPLATE = (category, frequency) =>
  `Your ${category} issue has reduced to ${frequency} recent occurrence${frequency === 1 ? '' : 's'} compared to earlier interviews. Keep practicing to fully resolve it.`;

module.exports = { RECOMMENDATION_TEXTS, GENERIC_TEMPLATE, IMPROVEMENT_TEMPLATE };
