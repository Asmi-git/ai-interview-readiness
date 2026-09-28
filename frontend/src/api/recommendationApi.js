import { apiRequest } from './apiRequest';

export function listRecommendations() {
  return apiRequest('/recommendations', { method: 'GET' });
}

export function dismissRecommendation(id) {
  return apiRequest(`/recommendations/${id}/dismiss`, { method: 'PUT' });
}
