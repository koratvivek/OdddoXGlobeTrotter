import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'globetrotter_saved_destinations';

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useSavedDestinations() {
  const [saved, setSaved] = useState(readSaved);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const toggleSaved = useCallback((cityId) => {
    setSaved((prev) =>
      prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [...prev, cityId],
    );
  }, []);

  const isSaved = useCallback((cityId) => saved.includes(cityId), [saved]);

  return { saved, toggleSaved, isSaved };
}
