import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import hero from "@/assets/hero.jpg";
import { useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Map,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Map, Plus, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/gt/app-shell";
import { BudgetDonut } from "@/components/gt/budget";
import {
  DestinationCard,
  DestinationCardSkeleton,
  BudgetDonutSkeleton,
  EmptyState,
  LoadingGrid,
  StatCard,
  TripCard,
} from "@/components/gt/cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useSavedDestinations } from "@/hooks/useSavedDestinations";
import { cn } from "@/lib/utils";
import { DEFAULT_COVER } from "@/lib/city-meta";
import { budgetTotal, currency, tripStatus } from "@/lib/trip-utils";
import { fetchAllCities, fetchTripBudget, fetchTrips } from "@/lib/trips-api";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saved, toggleSaved } = useSavedDestinations();
  const [trips, setTrips] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusBudget, setFocusBudget] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tripData, cityList] = await Promise.all([
          fetchTrips({ page: 1, pageSize: 50, status: "all", sort: "date" }),
          fetchAllCities(),
        ]);
        if (!cancelled) {
          setTrips(tripData.items);
          setCities(cityList);
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = useMemo(
    () => trips.filter((t) => tripStatus(t) !== "completed").slice(0, 6),
    [trips],
  );
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
      plannedBudget: focusBudget.budget_cap
        ? Number(focusBudget.budget_cap)
        : 0,
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
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const recommended = cities.slice(0, 6);

  const slides = useMemo(
    () => [
      {
        id: "europe",
        image: cities.find((c) => c.name === "Paris")?.image || DEFAULT_COVER,
        label: "Featured this month",
        title: "Two weeks across Europe, planned in one afternoon",
        primary: { label: "Start planning", to: "/trips/new" },
        secondary: { label: "Explore destinations", to: "/explore" },
      },
      {
        id: "japan",
        image:
          cities.find((c) => c.name === "Tokyo")?.image ||
          cities.find((c) => c.name === "Kyoto")?.image ||
          DEFAULT_COVER,
        label: "Trending now",
        title: "Cherry blossoms and neon lights in Japan",
        primary: { label: "Plan Tokyo trip", to: "/trips/new" },
        secondary: { label: "View gallery", to: "/explore" },
      },
      {
        id: "santorini",
        image: hero,
        label: "Mediterranean escape",
        title: "White walls and blue domes of Santorini",
        primary: { label: "Build itinerary", to: "/trips/new" },
        secondary: null,
      },
    ],
    [cities],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <AppShell
      title={`${greeting}, ${user?.first_name ?? "traveller"} 👋`}
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
        <section className="group relative overflow-hidden rounded-3xl border border-border shadow-card">
          <div className="relative h-56 w-full sm:h-72">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-1000",
                  currentSlide === idx ? "z-10 opacity-100" : "z-0 opacity-0",
                )}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 text-background sm:p-10">
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-90">
                    {slide.label}
                  </p>
                  <h2 className="max-w-md text-2xl font-extrabold leading-tight sm:text-4xl">
                    {slide.title}
                  </h2>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button asChild className="rounded-full">
                      <Link to={slide.primary.to}>{slide.primary.label}</Link>
                    </Button>
                    {slide.secondary && (
                      <Button
                        asChild
                        variant="secondary"
                        className="rounded-full border-transparent bg-background/20 text-background backdrop-blur hover:bg-background/30"
                      >
                        <Link to={slide.secondary.to}>
                          {slide.secondary.label}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  currentSlide === idx
                    ? "w-6 bg-background"
                    : "w-1.5 bg-background/50 hover:bg-background/80",
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() =>
              setCurrentSlide((s) => (s - 1 + slides.length) % slides.length)
            }
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/20 p-2 text-background opacity-0 backdrop-blur transition-all hover:bg-background/40 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentSlide((s) => (s + 1) % slides.length)}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/20 p-2 text-background opacity-0 backdrop-blur transition-all hover:bg-background/40 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active trips"
            value={String(
              trips.filter((t) => tripStatus(t) !== "completed").length,
            )}
            icon={Map}
            hint="Ongoing and upcoming"
          />
          <StatCard
            label="Total trips"
            value={String(trips.length)}
            icon={Compass}
            tone="accent"
            hint="Since you joined"
          />
          <StatCard
            label="Planned spend"
            value={currency(
              trips.reduce(
                (s, t) => s + (budgetTotal(t.budget) || t.plannedBudget),
                0,
              ),
            )}
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
              <p className="text-sm text-muted-foreground">
                Pick up planning where you left off.
              </p>
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
                <p className="text-sm text-muted-foreground">
                  Popular with travellers planning right now.
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/explore">Explore</Link>
              </Button>
            </div>
            <div className="scroll-row sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible xl:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <DestinationCardSkeleton key={i} />
                  ))
                : recommended.map((c) => (
                    <DestinationCard
                      key={c.id}
                      city={c}
                      saved={saved.includes(c.id)}
                      onSave={() => toggleSaved(c.id)}
                      onAdd={() =>
                        navigate("/trips/new?recommend_city_id=" + c.id)
                      }
                      className="w-64 shrink-0 sm:w-auto"
                    />
                  ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Budget highlights</h2>
            {loading ? (
              <BudgetDonutSkeleton />
            ) : focusTripWithBudget ? (
              <Card className="space-y-4 rounded-2xl border-border p-5 shadow-card">
                <div>
                  <p className="text-sm text-muted-foreground">Current trip</p>
                  <p className="font-bold">{focusTripWithBudget.name}</p>
                </div>
                <BudgetDonut trip={focusTripWithBudget} height={200} />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">Planned</p>
                    <p className="font-bold">
                      {currency(focusTripWithBudget.plannedBudget)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p
                      className={`font-bold ${
                        focusTripWithBudget.plannedBudget -
                          budgetTotal(focusTripWithBudget.budget) <
                        0
                          ? "text-destructive"
                          : "text-success"
                      }`}
                    >
                      {currency(
                        focusTripWithBudget.plannedBudget -
                          budgetTotal(focusTripWithBudget.budget),
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full"
                >
                  <Link to={`/trips/${focusTripWithBudget.id}/budget`}>
                    View full budget
                  </Link>
                </Button>
              </Card>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No budget yet"
                description="Create a trip to start tracking spend."
              />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
