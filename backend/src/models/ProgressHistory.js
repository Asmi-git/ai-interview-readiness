const mongoose = require('mongoose');

const progressHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: String, required: true }, // "YYYY-MM"
    readinessScore: { type: Number, default: null },
    technicalScore: { type: Number, default: null },
    communicationScore: { type: Number, default: null },
    confidenceScore: { type: Number, default: null },
    roleSkillCoverage: { type: Number, default: null },
    // { [category]: frequency } — a plain snapshot of pattern frequencies
    // at the time this record was taken, so "reduced from 4 to 2
    // occurrences" can be shown later even after patterns change.
    patternCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

progressHistorySchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('ProgressHistory', progressHistorySchema);
