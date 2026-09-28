/**
 * Shared request helper for authenticated API calls. Sends credentials
 * (httpOnly cookie) and normalizes errors the same way authApi.js does,
 * so every page can just try/catch and read err.message / err.fieldErrors.
 */
export async function apiRequest(path, options = {}) {
  const res = await fetch(`/api${path}`, {
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
