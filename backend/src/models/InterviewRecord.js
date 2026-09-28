const mongoose = require('mongoose');
const { INTERVIEW_TYPES, INTERVIEW_RESULTS, STRUGGLE_AREAS, STRUGGLE_REASONS } = require('../config/constants');

const interviewRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    companyName: { type: String, required: [true, 'Company/interview name is required'], trim: true },
    date: { type: Date, required: [true, 'Interview date is required'] },
    targetRole: { type: String, required: [true, 'Target role is required'], trim: true },
    interviewType: {
      type: String,
      required: [true, 'Interview type is required'],
      enum: { values: INTERVIEW_TYPES, message: 'Please select a valid interview type.' },
    },
    interviewRound: { type: String, required: [true, 'Interview round is required'], trim: true },
    result: {
      type: String,
      required: [true, 'Interview result is required'],
      enum: { values: INTERVIEW_RESULTS, message: 'Please select a valid result.' },
    },

    technicalPerformance: { type: Number, required: true, min: 1, max: 5 },
    communicationPerformance: { type: Number, required: true, min: 1, max: 5 },
    confidenceLevel: { type: Number, required: true, min: 1, max: 5 },
    projectExplanationPerformance: { type: Number, required: true, min: 1, max: 5 },

    struggleAreas: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((a) => STRUGGLE_AREAS.includes(a)),
        message: 'One or more struggle areas are not recognized.',
      },
    },

    // WHY the struggle happened, independent of WHAT topic (struggleAreas)
    // it was about — this is what makes "why was this pattern detected"
    // and recommendations specific instead of generic.
    struggleReasons: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((r) => STRUGGLE_REASONS.includes(r)),
        message: 'One or more struggle reasons are not recognized.',
      },
    },

    interviewerFeedback: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },

    // Populated in a later phase by the AI service (embeddings for pattern
    // clustering). Left empty until that pipeline exists — never faked.
    embeddingVector: { type: [Number], default: undefined, select: false },
  },
  { timestamps: true }
);

interviewRecordSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('InterviewRecord', interviewRecordSchema);
