import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { AppShell } from '@/components/gt/app-shell';
import { EmptyState, StatusBadge } from '@/components/gt/cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { currency, formatDate, formatRange, tripStatus } from '@/lib/trip-utils';
import { fetchAllTrips, fetchTripWithItinerary } from '@/lib/trips-api';
import { cn } from '@/lib/utils';

const iso = (d) => {
  const copy = new Date(d);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
};

function eventsByDay(trips) {
  const map = new Map();
  const push = (date, event) => {
    const list = map.get(date) ?? [];
    list.push(event);
    map.set(date, list);
  };

  for (const trip of trips) {
    const d = new Date(trip.startDate);
    const last = new Date(trip.endDate);
    while (d <= last) {
      push(iso(d), {
        tripId: trip.id,
        tripName: trip.name,
        label: trip.name,
        kind: 'trip',
      });
      d.setDate(d.getDate() + 1);
    }

    for (const stop of trip.stops || []) {
      for (const ta of stop.activities || []) {
        push(ta.scheduledDate, {
          tripId: trip.id,
          tripName: trip.name,
          label: `${ta.scheduledTime} ${ta.activityName || 'Activity'} · ${stop.cityName || ''}`,
          kind: 'activity',
          cost: ta.estimatedCost,
        });
      }
    }
  }

  return map;
}

export function CalendarPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = iso(new Date());
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const listed = await fetchAllTrips();
        const withItinerary = await Promise.all(
          listed.map((trip) => fetchTripWithItinerary(trip.id)),
        );
        if (!cancelled) setTrips(withItinerary);
      } catch {
        if (!cancelled) setTrips([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const events = useMemo(() => eventsByDay(trips), [trips]);

  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells = Array.from({ length: startOffset }, () => null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(iso(new Date(cursor.year, cursor.month, i)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const upcoming = [...trips]
    .filter((t) => tripStatus(t) !== 'completed')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const selectedEvents = events.get(selected) ?? [];

  const shift = (delta) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  if (loading) {
    return (
      <AppShell title="Calendar">
        <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Calendar" subtitle="Trips and activities at a glance">
      {trips.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing on the calendar yet"
          description="Plan your first trip and its dates and activities will show up here."
          action={
            <Button asChild className="rounded-full">
              <Link to="/trips/new">Plan a Trip</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="min-w-0 space-y-4 rounded-2xl border-border p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="min-w-0 truncate text-lg font-bold">{monthLabel}</h2>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => shift(-1)} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    const d = new Date();
                    setCursor({ year: d.getFullYear(), month: d.getMonth() });
                    setSelected(today);
                  }}
                >
                  Today
                </Button>
                <Button size="icon" variant="ghost" onClick={() => shift(1)} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d.slice(0, 1)}
                  <span className="hidden sm:inline">{d.slice(1)}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((date, i) => {
                if (!date) return <div key={`e-${i}`} />;
                const dayEvents = events.get(date) ?? [];
                const hasTrip = dayEvents.some((e) => e.kind === 'trip');
                const hasActivity = dayEvents.some((e) => e.kind === 'activity');
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelected(date)}
                    aria-label={`${formatDate(date)}, ${dayEvents.length} events`}
                    aria-pressed={selected === date}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-sm transition-colors',
                      selected === date
                        ? 'border-primary bg-primary/10 font-semibold text-primary'
                        : 'border-transparent hover:bg-secondary',
                      date === today && selected !== date && 'border-border font-semibold',
                      hasTrip && selected !== date && 'bg-secondary/70',
                    )}
                  >
                    <span>{Number(date.slice(8, 10))}</span>
                    <span className="flex h-1.5 items-center gap-0.5">
                      {hasTrip && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      {hasActivity && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Trip day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Activity
              </span>
            </div>
          </Card>

          <div className="min-w-0 space-y-5">
            <Card className="min-w-0 space-y-3 rounded-2xl border-border p-5 shadow-card">
              <h2 className="text-base font-bold">{formatDate(selected)}</h2>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing planned for this day.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((e, i) => (
                    <li key={`${e.tripId}-${i}`} className="rounded-xl bg-secondary/60 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{e.label}</p>
                          <Link
                            to={`/trips/${e.tripId}`}
                            className="truncate text-xs text-primary hover:underline"
                          >
                            {e.tripName}
                          </Link>
                        </div>
                        <Badge variant="secondary" className="shrink-0 capitalize">
                          {e.kind}
                        </Badge>
                      </div>
                      {typeof e.cost === 'number' && e.cost > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">{currency(e.cost)}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="min-w-0 space-y-3 rounded-2xl border-border p-5 shadow-card">
              <h2 className="text-base font-bold">Upcoming trips</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming trips scheduled.</p>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((t) => (
                    <li key={t.id} className="flex items-center gap-3">
                      <img
                        src={t.coverImage}
                        alt={t.name}
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/trips/${t.id}`}
                          className="block truncate text-sm font-semibold hover:underline"
                        >
                          {t.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatRange(t.startDate, t.endDate)}
                        </p>
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {t.stops.map((s) => s.cityName).filter(Boolean).join(' · ') || 'No stops yet'}
                        </p>
                      </div>
                      <StatusBadge trip={t} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
