/**
 * Internal client for the Python AI service. Called server-to-server only
 * (never exposed to the browser). If the AI service is down or errors,
 * callers should degrade gracefully — pattern analysis failing must never
 * block saving an interview record, since that's the user's actual data.
 */
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Sends a user's interview history to the AI service for pattern analysis.
 * Returns null (not a throw) on any failure, so callers can treat "AI
 * service unavailable" as a soft failure rather than a hard error.
 */
async function analyzeInterviews(userId, interviews) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const payload = {
      userId: String(userId),
      interviews: interviews.map((iv) => ({
        id: String(iv._id),
        date: iv.date,
        struggleAreas: iv.struggleAreas || [],
        description: iv.description || '',
        interviewerFeedback: iv.interviewerFeedback || '',
      })),
    };

    const res = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[aiServiceClient] AI service returned ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[aiServiceClient] Could not reach AI service:', err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { analyzeInterviews };
