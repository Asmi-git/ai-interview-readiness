/**
 * Builds the plain-object shape of a readiness report from already-computed
 * pieces (profile, readiness score result, patterns, recommendations).
 * Deliberately a pure function — no DB, no PDF library — so it's testable
 * on its own (see tests/reportData.test.js).
 */
function buildReportData({ profile, readinessResult, patterns, recommendations, totalInterviews }) {
  return {
    generatedAt: new Date(),
    name: profile?.name || null,
    targetRole: profile?.targetRole || null,
    score: readinessResult.score,
    scoreReasons: readinessResult.reasons || [],
    breakdown: readinessResult.breakdown || [],
    totalInterviews,
    patterns: patterns.map((p) => ({
      category: p.category,
      frequency: p.frequency,
      trend: p.trend,
      dominantReason: p.dominantReason || null,
    })),
    recommendations: recommendations.map((r) => ({
      category: r.patternCategory,
      priority: r.priority,
      text: r.recommendationText,
    })),
  };
}

const TREND_LABEL = {
  increasing: 'Getting more frequent',
  decreasing: 'Improving',
  stable: 'Stable',
  insufficient_data: 'Not enough data yet',
};

/**
 * Renders a reportData object (from buildReportData) into the given
 * PDFDocument. Caller owns piping the document to a response or file —
 * this function only writes content, so it's reusable and testable by
 * rendering to an in-memory buffer (see tests/reportPdf.test.js).
 */
function renderReadinessPdf(doc, reportData) {
  doc.fontSize(20).fillColor('#10152b').text('Prepwise — Interview Readiness Report', { align: 'left' });
  doc.moveDown(0.3);
  doc
    .fontSize(10)
    .fillColor('#4b5163')
    .text(`Generated ${reportData.generatedAt.toLocaleDateString()} for ${reportData.name || 'user'}${reportData.targetRole ? ` — Target role: ${reportData.targetRole}` : ''}`);
  doc.moveDown(1);

  // Readiness score
  doc.fontSize(14).fillColor('#10152b').text('Readiness Score');
  doc.moveDown(0.3);
  if (reportData.score === null) {
    doc.fontSize(11).fillColor('#4b5163').text('Not enough data yet to calculate a score.');
    reportData.scoreReasons.forEach((reason) => doc.text(`• ${reason}`));
  } else {
    doc.fontSize(24).fillColor('#4b3fe0').text(`${reportData.score}%`);
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#4b5163');
    reportData.breakdown.forEach((c) => {
      const value = c.available ? `${c.value}%` : 'Not enough data';
      doc.text(`${c.label}: ${value}`);
    });
  }
  doc.moveDown(1);

  // Patterns
  doc.fontSize(14).fillColor('#10152b').text('Recurring Patterns');
  doc.moveDown(0.3);
  if (reportData.patterns.length === 0) {
    doc.fontSize(11).fillColor('#4b5163').text('No recurring patterns detected yet.');
  } else {
    reportData.patterns.forEach((p) => {
      doc.fontSize(11).fillColor('#10152b').text(`${p.category} — ${p.frequency} of ${reportData.totalInterviews} interviews`, {
        continued: false,
      });
      doc
        .fontSize(9)
        .fillColor('#4b5163')
        .text(
          `Trend: ${TREND_LABEL[p.trend] || p.trend}${p.dominantReason ? ` · Most common reason: "${p.dominantReason}"` : ''}`
        );
      doc.moveDown(0.4);
    });
  }
  doc.moveDown(0.6);

  // Recommendations
  doc.fontSize(14).fillColor('#10152b').text('Recommendations');
  doc.moveDown(0.3);
  if (reportData.recommendations.length === 0) {
    doc.fontSize(11).fillColor('#4b5163').text('No active recommendations yet.');
  } else {
    reportData.recommendations.forEach((r) => {
      doc.fontSize(11).fillColor('#10152b').text(`${r.category} (${r.priority} priority)`);
      doc.fontSize(9).fillColor('#4b5163').text(r.text);
      doc.moveDown(0.4);
    });
  }

  doc.moveDown(1);
  doc
    .fontSize(8)
    .fillColor('#8a8fa3')
    .text('Generated locally by Prepwise. This report reflects data you entered yourself — no external service was used to produce it.');
}

module.exports = { buildReportData, renderReadinessPdf };
