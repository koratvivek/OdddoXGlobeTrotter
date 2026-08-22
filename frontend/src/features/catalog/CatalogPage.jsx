import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { ActivityCard, ActivityCardSkeleton, DestinationCard, DestinationCardSkeleton, EmptyState } from '@/components/gt/cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSavedDestinations } from '@/hooks/useSavedDestinations';
import { fetchAllCities, fetchActivitiesPage } from '@/lib/trips-api';

const categories = ['All', 'Sightseeing', 'Food', 'Adventure', 'Culture', 'Relax', 'Nightlife'];

export function CatalogPage() {
  const navigate = useNavigate();
  const { saved, toggleSaved } = useSavedDestinations();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);

  const [cities, setCities] = useState([]);
  const [activityData, setActivityData] = useState({ items: [], total_pages: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAllCities()
      .then((list) => {
        if (!cancelled) setCities(list);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load destinations');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const regions = useMemo(() => {
    const allRegions = cities.map((c) => c.region).filter(Boolean);
    return ['All', ...Array.from(new Set(allRegions)).sort()];
  }, [cities]);

  const countriesInRegion = useMemo(() => {
    if (region === 'All') return [];
    return [...new Set(cities.filter((c) => c.region === region).map((c) => c.country).filter(Boolean))];
  }, [cities, region]);

  const apiCountry = countriesInRegion.length === 1 ? countriesInRegion[0] : undefined;

  useEffect(() => {
    setPage(1);
  }, [query, region, category]);

  useEffect(() => {
    let cancelled = false;
    setActivitiesLoading(true);
    fetchActivitiesPage({
      page,
      pageSize: 20,
      q: query.trim() || undefined,
      category: category === 'All' ? undefined : category,
      country: apiCountry,
    })
      .then((data) => {
        if (!cancelled) setActivityData(data);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load activities');
      })
      .finally(() => {
        if (!cancelled) setActivitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, query, category, apiCountry]);

  const filteredCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cities
      .filter((c) => (region === 'All' ? true : c.region === region))
      .filter((c) => !q || `${c.name} ${c.country} ${c.description}`.toLowerCase().includes(q))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [cities, query, region]);

  const cityByIdMap = useMemo(() => {
    const map = new Map();
    cities.forEach((c) => map.set(c.id, c));
    return map;
  }, [cities]);

  const filteredActivities = useMemo(() => {
    if (region === 'All' || apiCountry) return activityData.items;
    const ids = new Set(cities.filter((c) => c.region === region).map((c) => c.id));
    return activityData.items.filter((a) => ids.has(a.cityId));
  }, [activityData.items, region, apiCountry, cities]);

  const popular = filteredCities.slice(0, 3);
  const recommended = filteredCities.slice(3, 6);
  const cheapest = [...filteredActivities].sort((a, b) => a.cost - b.cost).slice(0, 3);

  const pages = useMemo(() => {
    const total = activityData.total_pages || 0;
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [activityData.total_pages]);

  const goToTrip = (cityId) => {
    if (!cityId) return;
    navigate(`/trips/new?recommend_city_id=${cityId}`);
  };

  return (
    <div className="space-y-10">
      <Card className="space-y-4 rounded-2xl border-border p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cities or activities"
              aria-label="Search destinations and activities"
              className="h-11 rounded-xl pl-9"
            />
          </div>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="h-11 rounded-xl" aria-label="Filter by region">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r === 'All' ? 'All regions' : r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 rounded-xl" aria-label="Filter activities by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === 'All' ? 'All activities' : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {isLoading || activitiesLoading
            ? 'Loading...'
            : `${filteredCities.length} destinations · ${activityData.total || filteredActivities.length} activities`}
        </p>
      </Card>

      {!isLoading && filteredCities.length === 0 && filteredActivities.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nothing matches that search"
          description="Try a different city name, region or activity category."
          action={
            <Button
              className="rounded-full"
              onClick={() => {
                setQuery('');
                setRegion('All');
                setCategory('All');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {(isLoading || popular.length > 0) && (
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Popular destinations</h2>
                  <p className="text-sm text-muted-foreground">Most-planned cities on GlobeTrotter right now.</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {isLoading
                  ? Array.from({ length: 3 }).map((_, i) => <DestinationCardSkeleton key={i} />)
                  : popular.map((c) => (
                      <DestinationCard
                        key={c.id}
                        city={c}
                        saved={saved.includes(c.id)}
                        onSave={() => {
                          toggleSaved(c.id);
                          toast.success(saved.includes(c.id) ? `${c.name} removed from saved` : `${c.name} saved`);
                        }}
                        onAdd={() => goToTrip(c.id)}
                      />
                    ))}
              </div>
            </section>
          )}

          {(isLoading || recommended.length > 0) && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Recommended for you</h2>
                <p className="text-sm text-muted-foreground">Based on the destinations you&apos;ve saved.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {isLoading
                  ? Array.from({ length: 3 }).map((_, i) => <DestinationCardSkeleton key={i} />)
                  : recommended.map((c) => (
                      <DestinationCard
                        key={c.id}
                        city={c}
                        saved={saved.includes(c.id)}
                        onSave={() => {
                          toggleSaved(c.id);
                          toast.success(saved.includes(c.id) ? `${c.name} removed from saved` : `${c.name} saved`);
                        }}
                        onAdd={() => goToTrip(c.id)}
                      />
                    ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Popular activities</h2>
              <p className="text-sm text-muted-foreground">Highest rated experiences across every city.</p>
            </div>
            {activitiesLoading ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ActivityCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activities match these filters.</p>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredActivities.map((a) => (
                  <ActivityCard
                    key={a.id}
                    activity={a}
                    city={cityByIdMap.get(a.cityId)}
                    onAdd={() => goToTrip(a.cityId)}
                  />
                ))}
              </div>
            )}
            {activityData.total_pages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      disabled={page <= 1}
                      onClick={() => page > 1 && setPage((p) => p - 1)}
                    />
                  </PaginationItem>
                  {pages.slice(0, 7).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      disabled={page >= activityData.total_pages}
                      onClick={() => page < activityData.total_pages && setPage((p) => p + 1)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-bold">Travel inspiration</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {activitiesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card
                    key={i}
                    className="flex flex-col animate-pulse overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card"
                  >
                    <div className="h-28 w-full bg-secondary/40" />
                    <div className="space-y-2.5 p-4 flex-1">
                      <div className="h-4 w-12 rounded-full bg-secondary/50" />
                      <div className="h-4 w-3/4 rounded bg-secondary/60" />
                      <div className="h-3 w-1/2 rounded bg-secondary/40" />
                    </div>
                  </Card>
                ))
              ) : (
                cheapest.map((a) => {
                  const city = cityByIdMap.get(a.cityId);
                  return (
                    <Card
                      key={a.id}
                      className="flex flex-col overflow-hidden rounded-2xl border-border bg-card p-0 shadow-card"
                    >
                      <img
                        src={city?.image_url || city?.image}
                        alt={city?.name ?? 'Destination'}
                        loading="lazy"
                        className="h-28 w-full object-cover"
                      />
                      <div className="flex-1 space-y-1 p-4">
                        <Badge variant="secondary">{a.category || a.type}</Badge>
                        <p className="line-clamp-1 text-sm font-semibold">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {city?.name} · {a.cost === 0 ? 'Free' : `from $${a.cost}`}
                        </p>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
