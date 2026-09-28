const InterviewRecord = require('../models/InterviewRecord');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { refreshPatternsForUser } = require('../services/patternAnalysisService');

const FIELDS = [
  'companyName',
  'date',
  'targetRole',
  'interviewType',
  'interviewRound',
  'result',
  'technicalPerformance',
  'communicationPerformance',
  'confidenceLevel',
  'projectExplanationPerformance',
  'struggleAreas',
  'struggleReasons',
  'interviewerFeedback',
  'description',
];

function pickFields(body) {
  const data = {};
  FIELDS.forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f];
  });
  return data;
}

/** GET /api/interviews — list, most recent first. */
const listInterviews = asyncHandler(async (req, res) => {
  const interviews = await InterviewRecord.find({ userId: req.user.id }).sort({ date: -1 });
  res.status(200).json({ success: true, interviews });
});

/** POST /api/interviews */
const createInterview = asyncHandler(async (req, res) => {
  const data = pickFields(req.body);
  const interview = await InterviewRecord.create({ ...data, userId: req.user.id });

  // Pattern analysis failing must never block saving the user's actual
  // data — refreshPatternsForUser already handles AI-service-down
  // gracefully internally, but guard against unexpected DB errors too.
  try {
    await refreshPatternsForUser(req.user.id);
  } catch (err) {
    console.error('[interviewController] Pattern refresh failed after create:', err.message);
  }

  res.status(201).json({ success: true, message: 'Interview experience saved.', interview });
});

/**
 * Shared helper: finds an interview by id AND ensures it belongs to the
 * logged-in user. Returns 404 (not 403) for someone else's record, so we
 * don't leak whether a given id exists at all.
 */
async function findOwnedOrThrow(id, userId) {
  const interview = await InterviewRecord.findOne({ _id: id, userId });
  if (!interview) {
    throw new AppError('Interview record not found.', 404);
  }
  return interview;
}

/** GET /api/interviews/:id */
const getInterview = asyncHandler(async (req, res) => {
  const interview = await findOwnedOrThrow(req.params.id, req.user.id);
  res.status(200).json({ success: true, interview });
});

/** PUT /api/interviews/:id */
const updateInterview = asyncHandler(async (req, res) => {
  await findOwnedOrThrow(req.params.id, req.user.id); // ownership check before writing
  const data = pickFields(req.body);
  const interview = await InterviewRecord.findByIdAndUpdate(req.params.id, { $set: data }, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  try {
    await refreshPatternsForUser(req.user.id);
  } catch (err) {
    console.error('[interviewController] Pattern refresh failed after update:', err.message);
  }

  res.status(200).json({ success: true, message: 'Interview experience updated.', interview });
});

/** DELETE /api/interviews/:id */
const deleteInterview = asyncHandler(async (req, res) => {
  const interview = await findOwnedOrThrow(req.params.id, req.user.id);
  await interview.deleteOne();

  try {
    await refreshPatternsForUser(req.user.id);
  } catch (err) {
    console.error('[interviewController] Pattern refresh failed after delete:', err.message);
  }

  res.status(200).json({ success: true, message: 'Interview experience deleted.' });
});

module.exports = { listInterviews, createInterview, getInterview, updateInterview, deleteInterview };
