import { apiRequest } from './apiRequest';

export function fetchProfile() {
  return apiRequest('/profile', { method: 'GET' });
}

export function saveProfile(profileData) {
  return apiRequest('/profile', { method: 'PUT', body: JSON.stringify(profileData) });
}
