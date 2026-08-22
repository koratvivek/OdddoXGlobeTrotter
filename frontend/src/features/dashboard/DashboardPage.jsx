import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Map, Plus, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { BudgetDonut } from '@/components/gt/budget';
import { DestinationCard, EmptyState, LoadingGrid, StatCard, TripCard } from '@/components/gt/cards';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSavedDestinations } from '@/hooks/useSavedDestinations';
import { DEFAULT_COVER } from '@/lib/city-meta';
import { budgetTotal, currency, tripStatus } from '@/lib/trip-utils';
import { fetchAllCities, fetchTripBudget, fetchTrips } from '@/lib/trips-api';

export function DashboardPage() {
  const { user } = useAuth();
  const { saved, toggleSaved } = useSavedDestinations();
  const [trips, setTrips] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusBudget, setFocusBudget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tripData, cityList] = await Promise.all([
          fetchTrips({ page: 1, pageSize: 50, status: 'all', sort: 'date' }),
          fetchAllCities(),
        ]);
        if (!cancelled) {
          setTrips(tripData.items);
          setCities(cityList);
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = useMemo(() => trips.filter((t) => tripStatus(t) !== 'completed').slice(0, 6), [trips]);
  const focus = active[0];

  useEffect(() => {
    let cancelled = false;
    if (focus?.id) {
      fetchTripBudget(focus.id)
        .then((data) => {
          if (!cancelled) setFocusBudget(data);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [focus?.id]);

  const focusTripWithBudget = useMemo(() => {
    if (!focus) return null;
    if (!focusBudget) return focus;
    return {
      ...focus,
      plannedBudget: focusBudget.budget_cap ? Number(focusBudget.budget_cap) : 0,
      budget: {
        transport: Number(focusBudget.categories.transport),
        accommodation: Number(focusBudget.categories.accommodation),
        activities: Number(focusBudget.categories.activities),
        meals: Number(focusBudget.categories.meals),
        other: Number(focusBudget.categories.other),
      },
    };
  }, [focus, focusBudget]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const recommended = cities.slice(0, 6);
  const featuredImage = cities.find((c) => c.name === 'Paris')?.image || DEFAULT_COVER;

  return (
    <AppShell
      title={`${greeting}, ${user?.first_name ?? 'traveller'} 👋`}
      subtitle="Here's what's next on your travel map."
      actions={
        <Button asChild size="sm" className="rounded-full">
          <Link to="/trips/new">
            <Plus className="mr-1 h-4 w-4" />
            Plan a Trip
          </Link>
        </Button>
      }
    >
      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-border shadow-card">
          <img src={featuredImage} alt="Featured destination" className="h-56 w-full object-cover sm:h-72" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 text-background sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Featured this month</p>
            <h2 className="max-w-md text-2xl font-extrabold leading-tight sm:text-4xl">
              Two weeks across Europe, planned in one afternoon
            </h2>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="rounded-full">
                <Link to="/trips/new">Start planning</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <Link to="/explore">Explore destinations</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active trips"
            value={String(trips.filter((t) => tripStatus(t) !== 'completed').length)}
            icon={Map}
            hint="Ongoing and upcoming"
          />
          <StatCard label="Total trips" value={String(trips.length)} icon={Compass} tone="accent" hint="Since you joined" />
          <StatCard
            label="Planned spend"
            value={currency(trips.reduce((s, t) => s + (budgetTotal(t.budget) || t.plannedBudget), 0))}
            icon={Wallet}
            tone="success"
            hint="Across all trips"
          />
          <StatCard
            label="Saved destinations"
            value={String(saved.length)}
            icon={TrendingUp}
            tone="warning"
            hint="Bookmarked cities"
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Upcoming & ongoing trips</h2>
              <p className="text-sm text-muted-foreground">Pick up planning where you left off.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/trips">View all</Link>
            </Button>
          </div>
          {loading ? (
            <LoadingGrid count={3} />
          ) : active.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {active.map((t) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Map}
              title="No trips planned yet"
              description="Create your first multi-city itinerary and we'll handle the day-by-day structure."
              action={
                <Button asChild className="rounded-full">
                  <Link to="/trips/new">Plan a Trip</Link>
                </Button>
              }
            />
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Recommended destinations</h2>
                <p className="text-sm text-muted-foreground">Popular with travellers planning right now.</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/explore">Explore</Link>
              </Button>
            </div>
            <div className="scroll-row sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible xl:grid-cols-3">
              {recommended.map((c) => (
                <DestinationCard
                  key={c.id}
                  city={c}
                  saved={saved.includes(c.id)}
                  onSave={() => toggleSaved(c.id)}
                  onAdd={() => toast.success(`${c.name} saved to your shortlist`)}
                  className="w-64 shrink-0 sm:w-auto"
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Budget highlights</h2>
            {focusTripWithBudget ? (
              <Card className="space-y-4 rounded-2xl border-border p-5 shadow-card">
                <div>
                  <p className="text-sm text-muted-foreground">Current trip</p>
                  <p className="font-bold">{focusTripWithBudget.name}</p>
                </div>
                <BudgetDonut trip={focusTripWithBudget} height={200} />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">Planned</p>
                    <p className="font-bold">{currency(focusTripWithBudget.plannedBudget)}</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p
                      className={`font-bold ${
                        focusTripWithBudget.plannedBudget - budgetTotal(focusTripWithBudget.budget) < 0
                          ? 'text-destructive'
                          : 'text-success'
                      }`}
                    >
                      {currency(focusTripWithBudget.plannedBudget - budgetTotal(focusTripWithBudget.budget))}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link to={`/trips/${focusTripWithBudget.id}/budget`}>View full budget</Link>
                </Button>
              </Card>
            ) : (
              <EmptyState icon={Wallet} title="No budget yet" description="Create a trip to start tracking spend." />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
