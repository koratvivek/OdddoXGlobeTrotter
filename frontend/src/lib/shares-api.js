import { DEFAULT_COVER } from '@/lib/city-meta';
import { apiClient } from '@/lib/apiClient';
import { normalizeTripActivity } from '@/lib/trip-utils';

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

export function normalizeShareCard(card) {
  return {
    id: card.id,
    slug: card.slug,
    tripName: card.trip_name,
    description: card.description || '',
    coverImage: card.cover_photo || DEFAULT_COVER,
    startDate: card.start_date,
    endDate: card.end_date,
    budget: Number(card.budget_cap || 0),
    authorName: card.author_name,
    authorInitials: card.author_initials,
    destination: card.destination,
    highlights: card.highlights || [],
    stopCount: card.stop_count,
    activityCount: card.activity_count,
    likeCount: card.like_count,
    likedByMe: Boolean(card.liked_by_me),
    createdAt: card.created_at,
    days: Math.max(
      1,
      Math.round(
        (new Date(card.end_date).getTime() - new Date(card.start_date).getTime()) / 86400000,
      ),
    ),
  };
}

export function normalizePublicShare(data) {
  const categories = data.budget?.categories || {};
  return {
    slug: data.slug,
    tripId: String(data.trip_id),
    name: data.name,
    description: data.description || '',
    coverImage: data.cover_photo || DEFAULT_COVER,
    startDate: data.start_date,
    endDate: data.end_date,
    budgetCap: Number(data.budget_cap || 0),
    author: data.author,
    stops: (data.stops || []).map((stop) => ({
      id: stop.id,
      cityId: stop.city_id,
      cityName: stop.city_name,
      cityCountry: stop.city_country,
      cityImage: stop.city_image_url || DEFAULT_COVER,
      startDate: stop.start_date,
      endDate: stop.end_date,
      orderIndex: stop.order_index,
      activities: (stop.activities || []).map(normalizeTripActivity),
    })),
    budget: {
      transport: Number(categories.transport || 0),
      accommodation: Number(categories.accommodation || 0),
      activities: Number(categories.activities || 0),
      meals: Number(categories.meals || 0),
      other: Number(categories.other || 0),
      totalCost: Number(data.budget?.total_cost || 0),
    },
    createdAt: data.created_at,
  };
}

export async function createShare(tripId) {
  return apiClient('/shares', {
    method: 'POST',
    body: JSON.stringify({ trip_id: Number(tripId) }),
  });
}

export async function fetchPublicShare(slug) {
  const data = await apiClient(`/shares/public/${slug}`);
  return normalizePublicShare(data);
}

export async function fetchShares({ page = 1, pageSize = 20, q, sort = 'popular' } = {}) {
  const data = await apiClient(
    `/shares${buildQuery({ page, page_size: pageSize, q, sort })}`,
  );
  return {
    ...data,
    items: data.items.map(normalizeShareCard),
  };
}

export async function findShareBySlug(slug) {
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const data = await fetchShares({ page, pageSize: 100 });
    const match = data.items.find((item) => item.slug === slug);
    if (match) return match;
    totalPages = data.total_pages || 1;
    page += 1;
  }
  return null;
}

export async function likeShare(shareId) {
  return apiClient(`/shares/${shareId}/like`, { method: 'POST' });
}

export async function unlikeShare(shareId) {
  return apiClient(`/shares/${shareId}/like`, { method: 'DELETE' });
}

export async function copySharedTrip(slug) {
  return apiClient(`/shares/public/${slug}/copy`, { method: 'POST' });
}

export async function shareTripLink(tripId) {
  const share = await createShare(tripId);
  const url = `${window.location.origin}/share/${share.public_slug}`;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
  }
  return { slug: share.public_slug, url };
}
