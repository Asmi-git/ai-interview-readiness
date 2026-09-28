const PDFDocument = require('pdfkit');
const Profile = require('../models/Profile');
const InterviewRecord = require('../models/InterviewRecord');
const Pattern = require('../models/Pattern');
const Recommendation = require('../models/Recommendation');
const { asyncHandler } = require('../middleware/errorHandler');
const { computeReadinessScore } = require('../services/readinessScoreService');
const { getLatestSkillLevels } = require('../services/skillsService');
const { buildReportData, renderReadinessPdf } = require('../services/reportService');

/** GET /api/reports/readiness — downloads a PDF summary of the user's current readiness. */
const downloadReadinessReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [profile, skillLevels, interviews, patterns, recommendations] = await Promise.all([
    Profile.findOne({ userId }),
    getLatestSkillLevels(userId),
    InterviewRecord.find({ userId }),
    Pattern.find({ userId }).sort({ frequency: -1 }),
    Recommendation.find({ userId, dismissed: false }),
  ]);

  const readinessResult = computeReadinessScore({
    targetRole: profile?.targetRole,
    skillLevels,
    interviews,
    patterns,
  });

  const reportData = buildReportData({
    profile,
    readinessResult,
    patterns,
    recommendations,
    totalInterviews: interviews.length,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="prepwise-readiness-report.pdf"');

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  renderReadinessPdf(doc, reportData);
  doc.end();
});

module.exports = { downloadReadinessReport };
