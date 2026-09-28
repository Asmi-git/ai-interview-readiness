import { apiRequest } from './apiRequest';

export function fetchReadinessScore() {
  return apiRequest('/readiness', { method: 'GET' });
}
