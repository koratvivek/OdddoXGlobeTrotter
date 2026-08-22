import { useState, useEffect, useMemo } from 'react';
import { Compass, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { ActivityCard, DestinationCard, EmptyState } from '@/components/gt/cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSavedDestinations } from '@/hooks/useSavedDestinations';
import { apiClient } from '@/lib/apiClient';

const categories = ["All", "Sightseeing", "Food", "Adventure", "Culture", "Relax", "Nightlife"];

export function CatalogPage() {
  const { saved, toggleSaved } = useSavedDestinations();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All");
  const [category, setCategory] = useState("All");
  
  const [cities, setCities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [citiesData, activitiesData] = await Promise.all([
          apiClient('/cities?page_size=100'),
          apiClient('/activities')
        ]);
        setCities(citiesData.items || citiesData);
        setActivities(activitiesData.items || activitiesData);
      } catch (err) {
        toast.error("Failed to load catalog data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const regions = useMemo(() => {
    const allRegions = cities.map((c) => c.region).filter(Boolean);
    return ["All", ...Array.from(new Set(allRegions))];
  }, [cities]);

  const filteredCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cities
      .filter((c) => (region === "All" ? true : c.region === region))
      .filter((c) => !q || `${c.name} ${c.country} ${c.description}`.toLowerCase().includes(q))
      .sort((a, b) => (b.popularity_score || b.popularity) - (a.popularity_score || a.popularity));
  }, [cities, query, region]);

  const filteredActivities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities
      .filter((a) => (category === "All" ? true : (a.category || a.type) === category))
      .filter((a) => {
        const c = cities.find(city => city.id === (a.city_id || a.cityId));
        if (region !== "All" && c?.region !== region) return false;
        return !q || `${a.name} ${a.description} ${c?.name ?? ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)); // Assuming activities have popularity
  }, [activities, query, region, category, cities]);

  const popular = filteredCities.slice(0, 3);
  const recommended = filteredCities.slice(3, 6);
  const cheapest = [...activities].sort((a, b) => a.cost - b.cost).slice(0, 3);

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
              {regions.map((r) => <SelectItem key={r} value={r}>{r === "All" ? "All regions" : r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => setCategory(v)}>
            <SelectTrigger className="h-11 rounded-xl" aria-label="Filter activities by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c === "All" ? "All activities" : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading..." : `${filteredCities.length} destinations · ${filteredActivities.length} activities`}
        </p>
      </Card>

      {!isLoading && filteredCities.length === 0 && filteredActivities.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nothing matches that search"
          description="Try a different city name, region or activity category."
          action={
            <Button className="rounded-full" onClick={() => { setQuery(""); setRegion("All"); setCategory("All"); }}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {popular.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Popular destinations</h2>
                  <p className="text-sm text-muted-foreground">Most-planned cities on GlobeTrotter right now.</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {popular.map((c) => (
                  <DestinationCard
                    key={c.id}
                    city={c}
                    saved={saved.includes(c.id)}
                    onSave={() => {
                      toggleSaved(c.id);
                      toast.success(saved.includes(c.id) ? `${c.name} removed from saved` : `${c.name} saved`);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {recommended.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Recommended for you</h2>
                <p className="text-sm text-muted-foreground">Based on the destinations you&apos;ve saved.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {recommended.map((c) => (
                  <DestinationCard
                    key={c.id}
                    city={c}
                    saved={saved.includes(c.id)}
                    onSave={() => {
                      toggleSaved(c.id);
                      toast.success(saved.includes(c.id) ? `${c.name} removed from saved` : `${c.name} saved`);
                    }}
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
            {filteredActivities.length === 0 && !isLoading ? (
              <p className="text-sm text-muted-foreground">No activities match these filters.</p>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredActivities.slice(0, 8).map((a) => (
                  <ActivityCard 
                    key={a.id} 
                    activity={a} 
                    city={cities.find(city => city.id === (a.city_id || a.cityId))} 
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-bold">Travel inspiration</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {cheapest.map((a) => {
                const city = cities.find(city => city.id === (a.city_id || a.cityId));
                return (
                  <Card key={a.id} className="overflow-hidden rounded-2xl border-border p-0 shadow-card flex flex-col">
                    <img src={city?.image_url || city?.image} alt={city?.name ?? "Destination"} loading="lazy" className="h-28 w-full object-cover" />
                    <div className="space-y-1 p-4 flex-1">
                      <Badge variant="secondary">{a.category || a.type}</Badge>
                      <p className="font-semibold text-sm line-clamp-1">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {city?.name} · {a.cost === 0 ? "Free" : `from $${a.cost}`}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
