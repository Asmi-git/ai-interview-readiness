/**
 * Shared request helper for authenticated API calls. Sends credentials
 * (httpOnly cookie) and normalizes errors the same way authApi.js does,
 * so every page can just try/catch and read err.message / err.fieldErrors.
 *
 * In production (Vercel), VITE_API_BASE_URL is set to the Render backend URL
 * (e.g. https://prepwise-backend.onrender.com) so requests reach the backend.
 * In local dev it is empty and the Vite proxy forwards /api/... to localhost:5000.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const message = body?.message || `Request failed with status ${res.status}.`;
    const error = new Error(message);
    error.fieldErrors = body?.errors || null;
    error.status = res.status;
    throw error;
  }

  return body;
}
