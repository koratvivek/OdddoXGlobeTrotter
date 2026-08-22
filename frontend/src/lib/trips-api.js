import { apiClient } from '@/lib/apiClient';
import { normalizeCity } from '@/lib/city-meta';
import { normalizeStop, normalizeTrip, normalizeTripActivity } from '@/lib/trip-utils';

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
  const data = await apiClient('/stops', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeStop(data);
}

export async function updateStop(id, payload) {
  const data = await apiClient(`/stops/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return normalizeStop(data);
}

export async function deleteStop(id) {
  await apiClient(`/stops/${id}`, { method: 'DELETE' });
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

export async function fetchStopsPage(tripId, { page = 1, pageSize = 50 } = {}) {
  const data = await apiClient(
    `/stops${buildQuery({ trip_id: tripId, page, page_size: pageSize })}`,
  );
  return {
    ...data,
    items: data.items.map(normalizeStop),
  };
}

export async function fetchAllStops(tripId) {
  const stops = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const data = await fetchStopsPage(tripId, { page, pageSize: 100 });
    stops.push(...data.items);
    totalPages = data.total_pages || 1;
    page += 1;
  }
  return stops.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function fetchTripActivitiesPage(stopId, { page = 1, pageSize = 50 } = {}) {
  const data = await apiClient(
    `/trip-activities${buildQuery({ stop_id: stopId, page, page_size: pageSize })}`,
  );
  return {
    ...data,
    items: data.items.map(normalizeTripActivity),
  };
}

export async function fetchAllTripActivities(stopId) {
  const activities = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const data = await fetchTripActivitiesPage(stopId, { page, pageSize: 100 });
    activities.push(...data.items);
    totalPages = data.total_pages || 1;
    page += 1;
  }
  return activities;
}

export async function fetchActivitiesPage({ page = 1, pageSize = 100, cityId, q, category } = {}) {
  const data = await apiClient(
    `/activities${buildQuery({ page, page_size: pageSize, city_id: cityId, q, category })}`,
  );
  return {
    ...data,
    items: data.items.map((a) => ({
      id: a.id,
      cityId: a.city_id,
      name: a.name,
      category: a.category,
      description: a.description || '',
      cost: Number(a.cost),
      duration: a.duration,
      durationHours: a.duration / 60,
    })),
  };
}

export async function fetchAllActivitiesForCity(cityId) {
  const activities = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const data = await fetchActivitiesPage({ page, pageSize: 100, cityId });
    activities.push(...data.items);
    totalPages = data.total_pages || 1;
    page += 1;
  }
  return activities;
}

export async function createTripActivity(payload) {
  const data = await apiClient('/trip-activities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeTripActivity(data);
}

export async function updateTripActivity(id, payload) {
  const data = await apiClient(`/trip-activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return normalizeTripActivity(data);
}

export async function deleteTripActivity(id) {
  await apiClient(`/trip-activities/${id}`, { method: 'DELETE' });
}

export async function fetchTripWithItinerary(id) {
  const trip = await fetchTrip(id);
  const stops = await fetchAllStops(id);
  const stopsWithActivities = await Promise.all(
    stops.map(async (stop) => ({
      ...stop,
      activities: await fetchAllTripActivities(stop.id),
    })),
  );
  return { ...trip, stops: stopsWithActivities };
}
