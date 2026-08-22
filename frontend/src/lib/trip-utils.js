import { DEFAULT_COVER } from '@/lib/city-meta';

const EMPTY_BUDGET = {
  transport: 0,
  accommodation: 0,
  activities: 0,
  meals: 0,
  other: 0,
};

export const currency = (n) =>
  Number(n || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

export const budgetTotal = (b) =>
  (b?.transport || 0) +
  (b?.accommodation || 0) +
  (b?.activities || 0) +
  (b?.meals || 0) +
  (b?.other || 0);

export const tripDays = (trip) => {
  const start = new Date(trip.startDate).getTime();
  const end = new Date(trip.endDate).getTime();
  return Math.max(1, Math.round((end - start) / 86400000));
};

export const tripStatus = (trip) => {
  const today = new Date().toISOString().slice(0, 10);
  if (trip.endDate < today) return 'completed';
  if (trip.startDate > today) return 'upcoming';
  return 'ongoing';
};

export const tripProgress = (trip) => {
  const start = new Date(trip.startDate).getTime();
  const end = new Date(trip.endDate).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
};

export const formatRange = (start, end) => {
  const opts = { month: 'short', day: 'numeric' };
  const s = new Date(start).toLocaleDateString('en-US', opts);
  const e = new Date(end).toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${s} – ${e}`;
};

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

export function normalizeStop(stop) {
  return {
    id: stop.id,
    tripId: stop.trip_id,
    cityId: stop.city_id,
    cityName: stop.city_name,
    startDate: stop.start_date,
    endDate: stop.end_date,
    orderIndex: stop.order_index,
    activities: stop.activities || [],
  };
}

export function normalizeTripActivity(ta) {
  const time = ta.scheduled_time || '10:00:00';
  return {
    id: ta.id,
    stopId: ta.stop_id,
    activityId: ta.activity_id,
    scheduledDate: ta.scheduled_date,
    scheduledTime: time.length >= 5 ? time.slice(0, 5) : time,
    activityName: ta.activity_name || '',
    category: ta.category || '',
    duration: ta.duration || 0,
    estimatedCost: Number(ta.effective_cost ?? ta.cost ?? 0),
  };
}

export function activityHours(minutes) {
  const hours = Number(minutes || 0) / 60;
  return Number.isInteger(hours) ? hours : Math.round(hours * 10) / 10;
}

export function stopActivityCost(stop) {
  return (stop.activities || []).reduce((sum, a) => sum + (a.estimatedCost || 0), 0);
}

export function buildDays(trip) {
  const map = new Map();
  const stops = [...(trip.stops || [])].sort((a, b) => a.orderIndex - b.orderIndex);
  for (const stop of stops) {
    const cityName = stop.cityName || 'Unknown city';
    const sorted = [...(stop.activities || [])].sort((a, b) => {
      const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
      if (dateCmp !== 0) return dateCmp;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
    for (const ta of sorted) {
      const entry = map.get(ta.scheduledDate) ?? { date: ta.scheduledDate, cityName, items: [] };
      entry.items.push({
        id: ta.id,
        name: ta.activityName || 'Activity',
        category: ta.category || 'Sightseeing',
        duration: activityHours(ta.duration),
        startTime: ta.scheduledTime,
        cost: ta.estimatedCost,
      });
      map.set(ta.scheduledDate, entry);
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function normalizeTrip(trip) {
  const stops = (trip.stops || []).map((s) =>
    s.start_date !== undefined || s.city_id !== undefined ? normalizeStop(s) : s,
  );

  return {
    id: String(trip.id),
    name: trip.name,
    description: trip.description || '',
    startDate: trip.start_date,
    endDate: trip.end_date,
    coverImage: trip.cover_photo || DEFAULT_COVER,
    isPublic: Boolean(trip.is_public),
    plannedBudget: Number(trip.budget_cap || 0),
    budget: { ...EMPTY_BUDGET },
    stops,
    stopCount: trip.stop_count ?? stops.length,
  };
}

export function tripToApiPayload(trip) {
  return {
    name: trip.name,
    start_date: trip.startDate,
    end_date: trip.endDate,
    description: trip.description || null,
    cover_photo: trip.coverImage?.startsWith('blob:') ? null : trip.coverImage,
    is_public: trip.isPublic,
    budget_cap: trip.plannedBudget || null,
  };
}
