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

const COUNTRY_REGION = {
  France: 'Europe',
  Italy: 'Europe',
  Spain: 'Europe',
  Germany: 'Europe',
  'United Kingdom': 'Europe',
  UK: 'Europe',
  Greece: 'Europe',
  Portugal: 'Europe',
  Netherlands: 'Europe',
  Switzerland: 'Europe',
  Austria: 'Europe',
  Ireland: 'Europe',
  Belgium: 'Europe',
  Sweden: 'Europe',
  Norway: 'Europe',
  Denmark: 'Europe',
  Poland: 'Europe',
  Czechia: 'Europe',
  'Czech Republic': 'Europe',
  Japan: 'Asia',
  China: 'Asia',
  India: 'Asia',
  Indonesia: 'Asia',
  Thailand: 'Asia',
  Vietnam: 'Asia',
  'South Korea': 'Asia',
  Singapore: 'Asia',
  Malaysia: 'Asia',
  'United Arab Emirates': 'Asia',
  Turkey: 'Asia',
  Israel: 'Asia',
  USA: 'North America',
  'United States': 'North America',
  Canada: 'North America',
  Mexico: 'North America',
  Brazil: 'South America',
  Argentina: 'South America',
  Peru: 'South America',
  Chile: 'South America',
  Colombia: 'South America',
  Australia: 'Oceania',
  'New Zealand': 'Oceania',
  Egypt: 'Africa',
  Morocco: 'Africa',
  'South Africa': 'Africa',
  Kenya: 'Africa',
};

export function regionFromCountry(country) {
  if (!country) return '';
  return COUNTRY_REGION[country] || country;
}

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
    region: meta.region || regionFromCountry(city.country),
    image: city.image_url || city.image || DEFAULT_COVER,
    image_url: city.image_url || city.image || DEFAULT_COVER,
    description: meta.description || '',
    costIndex: clampCostIndex(city.cost_index ?? city.costIndex),
    popularity: city.popularity_score ?? city.popularity ?? 0,
    popularity_score: city.popularity_score ?? city.popularity ?? 0,
  };
}

export function cityById(cities, id) {
  const n = Number(id);
  return cities.find((c) => c.id === id || c.id === n);
}
