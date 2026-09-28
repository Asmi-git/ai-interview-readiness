const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patternCategory: { type: String, required: true },
    recommendationText: { type: String, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    dismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
