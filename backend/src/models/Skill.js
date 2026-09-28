const mongoose = require('mongoose');
const { ALL_SKILL_NAMES } = require('../config/constants');

const skillSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: ['technical', 'soft'], required: true },
    skillName: {
      type: String,
      required: true,
      enum: { values: ALL_SKILL_NAMES, message: 'Unknown skill name.' },
    },
    level: {
      type: Number,
      required: true,
      min: [0, 'Skill level cannot be below 0'],
      max: [100, 'Skill level cannot be above 100'],
    },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Fast lookup of "latest snapshot per skill for this user"
skillSchema.index({ userId: 1, skillName: 1, recordedAt: -1 });

module.exports = mongoose.model('Skill', skillSchema);
