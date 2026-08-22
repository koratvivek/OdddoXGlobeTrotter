export const CITY_META = {
  Paris: {
    region: 'Europe',
    description: 'Boulevards, boulangeries and world-class museums along the Seine.',
  },
  Tokyo: {
    region: 'Asia',
    description: 'Neon districts, quiet shrines and the best food city on earth.',
  },
  Rome: {
    region: 'Europe',
    description: 'Ancient ruins, piazza life and endless plates of cacio e pepe.',
  },
  Bali: {
    region: 'Asia',
    description: 'Rice terraces, surf beaches and temple mornings.',
  },
  'New York City': {
    region: 'North America',
    description: 'Five boroughs of skyline views, galleries and late-night bites.',
  },
  Barcelona: {
    region: 'Europe',
    description: 'Gaudí architecture, tapas crawls and city beaches.',
  },
};

export const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80';

/** Refined UI expects a 1–5 cost index for the $$$$$ display. */
export function clampCostIndex(value, fallback = 3) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(5, Math.max(1, n));
}

export function normalizeCity(city) {
  const meta = CITY_META[city.name] || {};
  return {
    id: city.id,
    name: city.name,
    country: city.country,
    region: meta.region || '',
    image: city.image_url || DEFAULT_COVER,
    description: meta.description || '',
    costIndex: clampCostIndex(city.cost_index ?? city.costIndex),
    popularity: city.popularity_score ?? city.popularity ?? 0,
  };
}

export function cityById(cities, id) {
  const n = Number(id);
  return cities.find((c) => c.id === id || c.id === n);
}
