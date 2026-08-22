import { apiClient } from './apiClient';

export async function fetchProfile() {
  return apiClient('/users/me');
}

export async function updateProfile(payload) {
  return apiClient('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAccount() {
  return apiClient('/users/me', {
    method: 'DELETE',
  });
}

export async function fetchSavedDestinations() {
  return apiClient('/users/me/saved-destinations');
}

export async function saveDestination(cityId) {
  return apiClient('/users/me/saved-destinations', {
    method: 'POST',
    body: JSON.stringify({ city_id: cityId }),
  });
}

export async function unsaveDestination(cityId) {
  return apiClient(`/users/me/saved-destinations/${cityId}`, {
    method: 'DELETE',
  });
}
