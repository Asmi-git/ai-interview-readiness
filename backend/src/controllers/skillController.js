const Skill = require('../models/Skill');
const { asyncHandler } = require('../middleware/errorHandler');
const { SKILL_CATALOG } = require('../config/constants');

/**
 * GET /api/skills
 * Returns the latest recorded level for every skill in the catalog.
 * Skills the user has never updated come back with level: null, so the
 * frontend can render them as "not yet rated" instead of silently 0.
 */
const getSkills = asyncHandler(async (req, res) => {
  // A simple per-skill query (rather than an aggregation pipeline) keeps this
  // readable and is plenty fast at this data size (a handful of skills).
  const allSkillNames = [...SKILL_CATALOG.technical, ...SKILL_CATALOG.soft];

  const results = await Promise.all(
    allSkillNames.map(async (skillName) => {
      const latest = await Skill.findOne({ userId: req.user.id, skillName }).sort({ recordedAt: -1 });
      return {
        skillName,
        category: SKILL_CATALOG.technical.includes(skillName) ? 'technical' : 'soft',
        level: latest ? latest.level : null,
        recordedAt: latest ? latest.recordedAt : null,
      };
    })
  );

  res.status(200).json({ success: true, skills: results });
});

/**
 * PUT /api/skills
 * Body: { skills: [{ skillName, level }, ...] }
 * Writes a new snapshot for each skill provided (append-only), so progress
 * over time can be reconstructed later rather than only knowing "now".
 */
const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  const allSkillNames = [...SKILL_CATALOG.technical, ...SKILL_CATALOG.soft];

  const now = new Date();
  const docs = skills.map((s) => ({
    userId: req.user.id,
    skillName: s.skillName,
    category: SKILL_CATALOG.technical.includes(s.skillName) ? 'technical' : 'soft',
    level: s.level,
    recordedAt: now,
  }));

  await Skill.insertMany(docs);

  res.status(200).json({ success: true, message: 'Preparation progress saved.' });
});

module.exports = { getSkills, updateSkills };
