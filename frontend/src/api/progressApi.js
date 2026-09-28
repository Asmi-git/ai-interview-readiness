import { apiRequest } from './apiRequest';

export function fetchMonthlyProgress() {
  return apiRequest('/progress/monthly', { method: 'GET' });
}
