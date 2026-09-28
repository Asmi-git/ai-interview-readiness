import { apiRequest } from './apiRequest';

export function fetchOptions() {
  return apiRequest('/meta/options', { method: 'GET' });
}
