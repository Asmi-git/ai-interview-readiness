/**
 * Tests the ACTUAL PDF output, not just the data shaping — renders a real
 * PDF to an in-memory buffer using pdfkit, then parses the text back out
 * using pdf-parse to confirm the right content actually appears in the
 * generated file. Run with: node src/tests/reportPdf.test.js
 */
const PDFDocument = require('pdfkit');
const { PDFParse } = require('pdf-parse');
const { buildReportData, renderReadinessPdf } = require('../services/reportService');

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  \u2713 ${description}`);
    passed += 1;
  } else {
    console.log(`  \u2717 ${description}`);
    failed += 1;
  }
}

function renderToBuffer(reportData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    renderReadinessPdf(doc, reportData);
    doc.end();
  });
}

async function extractText(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

async function run() {
  console.log('Generating a real PDF with populated data and parsing it back');
  const reportData = buildReportData({
    profile: { name: 'Asmi Sharma', targetRole: 'Software Developer' },
    readinessResult: {
      score: 68,
      reasons: [],
      breakdown: [
        { key: 'technical', label: 'Technical readiness', value: 70, available: true },
        { key: 'roleCoverage', label: 'Role skill coverage', value: null, available: false },
      ],
    },
    patterns: [
      { category: 'DBMS/SQL', frequency: 3, trend: 'stable', dominantReason: 'Became nervous' },
      { category: 'Confidence', frequency: 2, trend: 'decreasing', dominantReason: null },
    ],
    recommendations: [
      { patternCategory: 'DBMS/SQL', priority: 'high', recommendationText: 'Prioritize practicing SQL joins and normalization.' },
    ],
    totalInterviews: 6,
  });

  const buffer = await renderToBuffer(reportData);
  assert(buffer.length > 0, 'A non-empty PDF buffer was generated');
  assert(buffer.slice(0, 4).toString() === '%PDF', 'The output is a genuine PDF file (starts with the %PDF header)');

  const text = await extractText(buffer);

  assert(text.includes('Interview Readiness Report'), 'Report title appears in the actual rendered PDF text');
  assert(text.includes('Asmi Sharma'), "The user's real name appears in the PDF");
  assert(text.includes('Software Developer'), 'Target role appears in the PDF');
  assert(text.includes('68%'), 'The actual computed score appears in the PDF, not a placeholder');
  assert(text.includes('DBMS/SQL'), 'Pattern category appears in the PDF');
  assert(text.includes('3 of 6 interviews'), 'Exact frequency evidence ("3 of 6 interviews") appears in the PDF');
  assert(text.includes('Became nervous'), 'The dominant reason appears in the PDF');
  assert(text.includes('Not enough data'), "Unavailable breakdown component shows 'Not enough data', not a fake 0%");
  assert(
    text.includes('Prioritize practicing SQL joins'),
    'The actual recommendation text appears in the PDF, not a generic placeholder'
  );

  console.log('\nGenerating a PDF for a brand-new user with zero data (must not crash or fabricate a score)');
  const emptyReportData = buildReportData({
    profile: null,
    readinessResult: { score: null, reasons: ['Log at least one interview experience to calculate a readiness score.'] },
    patterns: [],
    recommendations: [],
    totalInterviews: 0,
  });
  const emptyBuffer = await renderToBuffer(emptyReportData);
  const emptyText = await extractText(emptyBuffer);
  assert(emptyBuffer.length > 0, 'A valid PDF is still generated for a user with no data');
  assert(
    emptyText.includes('Not enough data yet to calculate a score'),
    'Zero-data PDF honestly states no score is available, rather than showing 0% or crashing'
  );
  assert(
    emptyText.includes('No recurring patterns detected yet'),
    'Zero-data PDF correctly shows the patterns empty state'
  );

  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
