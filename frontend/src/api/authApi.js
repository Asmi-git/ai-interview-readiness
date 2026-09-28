const BASE_URL = '/api/auth';

/**
 * Thin wrapper around fetch for the auth endpoints.
 * Always sends credentials (so the httpOnly cookie flow works) and
 * throws a normalized Error with the backend's message on failure,
 * so components can just try/catch and show err.message.
 */
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body (e.g. network-level failure) — handled below
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

export function registerUser({ email, password }) {
  return request('/register', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function loginUser({ email, password }) {
  return request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function logoutUser() {
  return request('/logout', { method: 'POST' });
}

export function fetchCurrentUser() {
  return request('/me', { method: 'GET' });
}

export function changePassword({ currentPassword, newPassword }) {
  return request('/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
}
