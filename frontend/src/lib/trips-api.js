import { apiClient } from '@/lib/apiClient';
import { normalizeCity } from '@/lib/city-meta';
import { normalizeTrip } from '@/lib/trip-utils';

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchTrips({ page = 1, pageSize = 20, q, status = 'all', sort = 'date' } = {}) {
  const data = await apiClient(
    `/trips${buildQuery({ page, page_size: pageSize, q, status, sort })}`,
  );
  return {
    ...data,
    items: data.items.map(normalizeTrip),
  };
}

export async function fetchTrip(id) {
  const data = await apiClient(`/trips/${id}`);
  return normalizeTrip(data);
}

export async function createTrip(payload) {
  const data = await apiClient('/trips', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeTrip(data);
}

export async function updateTrip(id, payload) {
  const data = await apiClient(`/trips/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return normalizeTrip(data);
}

export async function deleteTrip(id) {
  await apiClient(`/trips/${id}`, { method: 'DELETE' });
}

export async function createStop(payload) {
  return apiClient('/stops', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCitiesPage({ page = 1, pageSize = 100, q } = {}) {
  const data = await apiClient(`/cities${buildQuery({ page, page_size: pageSize, q })}`);
  return {
    ...data,
    items: data.items.map(normalizeCity),
  };
}

export async function fetchAllCities() {
  const cities = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const data = await fetchCitiesPage({ page, pageSize: 100 });
    cities.push(...data.items);
    totalPages = data.total_pages || 1;
    page += 1;
  }
  return cities;
}

export async function fetchStops(tripId, { page = 1, pageSize = 50 } = {}) {
  return apiClient(`/stops${buildQuery({ trip_id: tripId, page, page_size: pageSize })}`);
}
