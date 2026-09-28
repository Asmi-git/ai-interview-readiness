const mongoose = require('mongoose');

const patternSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true },
    frequency: { type: Number, required: true },
    interviewIds: { type: [String], default: [] },
    trend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable', 'insufficient_data'],
      required: true,
    },
    source: {
      type: String,
      enum: ['structured_tags', 'keyword_match', 'semantic_cluster', 'both'],
      required: true,
    },
    // The most common struggle REASON (not topic) among this pattern's
    // contributing interviews, e.g. "Became nervous" — this is what makes
    // "why was this pattern detected" evidence specific rather than just
    // repeating the category name back. Null if no interview contributing
    // to this pattern recorded a reason.
    dominantReason: { type: String, default: null },
    lastDetectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

patternSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Pattern', patternSchema);
