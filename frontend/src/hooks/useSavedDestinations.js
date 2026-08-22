import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { fetchSavedDestinations, saveDestination, unsaveDestination } from '@/lib/users-api';

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
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    if (isAuthenticated) {
      fetchSavedDestinations()
        .then((data) => {
          if (mounted) {
            setSaved(data.map((d) => d.city_id));
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) setLoading(false);
        });
    } else {
      setSaved(readSaved());
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Sync to local storage only if not authenticated (or keep it as a fallback)
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
  }, [saved, isAuthenticated, loading]);

  const toggleSaved = useCallback(
    async (cityId) => {
      const isCurrentlySaved = saved.includes(cityId);

      // Optimistic update
      setSaved((prev) =>
        isCurrentlySaved ? prev.filter((id) => id !== cityId) : [...prev, cityId],
      );

      if (isAuthenticated) {
        try {
          if (isCurrentlySaved) {
            await unsaveDestination(cityId);
          } else {
            await saveDestination(cityId);
          }
        } catch (err) {
          toast.error('Failed to sync saved destination');
          // Revert optimistic update
          setSaved((prev) =>
            isCurrentlySaved ? [...prev, cityId] : prev.filter((id) => id !== cityId),
          );
        }
      }
    },
    [saved, isAuthenticated],
  );

  const isSaved = useCallback((cityId) => saved.includes(cityId), [saved]);

  return { saved, toggleSaved, isSaved, loading };
}
