import { apiRequest } from './apiRequest';

export function listPatterns() {
  return apiRequest('/patterns', { method: 'GET' });
}
