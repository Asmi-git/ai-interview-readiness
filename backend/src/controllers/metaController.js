const { asyncHandler } = require('../middleware/errorHandler');
const {
  TARGET_ROLES,
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
  SKILL_CATALOG,
  INTERVIEW_TYPES,
  INTERVIEW_RESULTS,
  STRUGGLE_AREAS,
  STRUGGLE_REASONS,
} = require('../config/constants');

/**
 * GET /api/meta/options
 * Serves dropdown/catalog options so the frontend never hardcodes its own
 * copy of roles/skills/interview options — add one in constants.js and it
 * shows up everywhere automatically.
 */
const getOptions = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    targetRoles: TARGET_ROLES,
    experienceLevels: EXPERIENCE_LEVELS,
    educationLevels: EDUCATION_LEVELS,
    skillCatalog: SKILL_CATALOG,
    interviewTypes: INTERVIEW_TYPES,
    interviewResults: INTERVIEW_RESULTS,
    struggleAreas: STRUGGLE_AREAS,
    struggleReasons: STRUGGLE_REASONS,
  });
});

module.exports = { getOptions };
