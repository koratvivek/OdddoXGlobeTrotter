import { apiClient } from './apiClient';

export async function fetchAdminOverview() {
  return apiClient('/admin/overview');
}

export async function fetchAdminUsers(params = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.append('page', params.page);
  if (params.pageSize) qs.append('page_size', params.pageSize);
  if (params.q) qs.append('q', params.q);
  return apiClient(`/admin/users?${qs.toString()}`);
}

export async function fetchAdminTripStats() {
  return apiClient('/admin/stats/trips');
}

export async function fetchAdminPopularCities(limit = 10) {
  return apiClient(`/admin/stats/cities?limit=${limit}`);
}

export async function fetchAdminPopularActivities(limit = 10) {
  return apiClient(`/admin/stats/activities?limit=${limit}`);
}
