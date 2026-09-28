const Skill = require('../models/Skill');
const { ALL_SKILL_NAMES } = require('../config/constants');

/** Returns { [skillName]: level|null } — the latest recorded level per skill. */
async function getLatestSkillLevels(userId) {
  const entries = await Promise.all(
    ALL_SKILL_NAMES.map(async (skillName) => {
      const latest = await Skill.findOne({ userId, skillName }).sort({ recordedAt: -1 });
      return [skillName, latest ? latest.level : null];
    })
  );
  return Object.fromEntries(entries);
}

module.exports = { getLatestSkillLevels };
