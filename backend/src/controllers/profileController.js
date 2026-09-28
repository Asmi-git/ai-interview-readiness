const Profile = require('../models/Profile');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * GET /api/profile
 * Returns null (not a 404) when the user hasn't created a profile yet,
 * so the frontend can render an empty state instead of treating it as an error.
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user.id });
  res.status(200).json({ success: true, profile: profile || null });
});

/**
 * PUT /api/profile
 * Creates the profile on first save, updates it on every save after that.
 */
const upsertProfile = asyncHandler(async (req, res) => {
  const { name, education, degree, experienceLevel, targetRole, preferredIndustry, skills, careerGoal } = req.body;

  const update = {
    name,
    education,
    degree,
    experienceLevel,
    targetRole,
    preferredIndustry: preferredIndustry || '',
    skills: Array.isArray(skills) ? skills.filter(Boolean) : [],
    careerGoal: careerGoal || '',
  };

  const profile = await Profile.findOneAndUpdate({ userId: req.user.id }, { $set: update, $setOnInsert: { userId: req.user.id } }, {
    new: true,
    upsert: true,
    runValidators: true,
    context: 'query',
  });

  if (!profile) {
    throw new AppError('Could not save your profile. Please try again.', 500);
  }

  res.status(200).json({ success: true, message: 'Profile saved successfully.', profile });
});

module.exports = { getProfile, upsertProfile };
