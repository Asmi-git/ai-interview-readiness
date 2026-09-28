import { apiRequest } from './apiRequest';

export function listInterviews() {
  return apiRequest('/interviews', { method: 'GET' });
}

export function getInterview(id) {
  return apiRequest(`/interviews/${id}`, { method: 'GET' });
}

export function createInterview(data) {
  return apiRequest('/interviews', { method: 'POST', body: JSON.stringify(data) });
}

export function updateInterview(id, data) {
  return apiRequest(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteInterview(id) {
  return apiRequest(`/interviews/${id}`, { method: 'DELETE' });
}
