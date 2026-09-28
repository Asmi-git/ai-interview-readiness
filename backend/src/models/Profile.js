const mongoose = require('mongoose');
const { EXPERIENCE_LEVELS, EDUCATION_LEVELS } = require('../config/constants');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    education: {
      type: String,
      required: [true, 'Education level is required'],
      enum: { values: EDUCATION_LEVELS, message: 'Please select a valid education level.' },
    },
    degree: { type: String, required: [true, 'Degree is required'], trim: true },
    experienceLevel: {
      type: String,
      required: [true, 'Experience level is required'],
      enum: { values: EXPERIENCE_LEVELS, message: 'Please select a valid experience level.' },
    },
    // Free text, not restricted to TARGET_ROLES, so users can enter a role
    // the predefined catalog doesn't cover yet (role-specific skill-coverage
    // matching just won't apply to it until it's added to the catalog).
    targetRole: { type: String, required: [true, 'Target role is required'], trim: true },
    preferredIndustry: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] }, // free-text tags, e.g. "React", "AWS"
    careerGoal: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
