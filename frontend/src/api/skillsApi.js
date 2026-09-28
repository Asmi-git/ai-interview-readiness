import { apiRequest } from './apiRequest';

export function fetchSkills() {
  return apiRequest('/skills', { method: 'GET' });
}

export function saveSkills(skills) {
  return apiRequest('/skills', { method: 'PUT', body: JSON.stringify({ skills }) });
}
