import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, Share2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { EmptyState } from '@/components/gt/cards';
import { TripNotFound } from '@/components/gt/trip-not-found';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cityById } from '@/lib/city-meta';
import {
  buildDays,
  currency,
  formatDate,
  formatRange,
  stopActivityCost,
  tripDays,
} from '@/lib/trip-utils';
import { fetchAllCities, fetchTripWithItinerary } from '@/lib/trips-api';

export function TripItineraryPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tripData, cityList] = await Promise.all([fetchTripWithItinerary(id), fetchAllCities()]);
      setTrip(tripData);
      setCities(cityList);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <AppShell title="Itinerary">
        <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
      </AppShell>
    );
  }

  if (notFound || !trip) return <TripNotFound title="Itinerary" />;

  const stops = [...trip.stops].sort((a, b) => a.orderIndex - b.orderIndex);
  const days = buildDays(trip);

  const share = () => {
    toast.info('Sharing comes in a later phase');
  };

  return (
    <AppShell
      title={`${trip.name} — Itinerary`}
      subtitle={`${formatRange(trip.startDate, trip.endDate)} · ${stops.length} stops`}
      actions={
        <>
          <Button asChild size="sm" variant="ghost" className="hidden rounded-full sm:inline-flex">
            <Link to={`/trips/${trip.id}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Builder
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={share}>
            <Share2 className="mr-1 h-4 w-4" />
            Share
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Card className="grid grid-cols-2 divide-border rounded-2xl border-border p-0 shadow-card sm:grid-cols-4 sm:divide-x">
          {[
            { label: 'Dates', value: formatRange(trip.startDate, trip.endDate), icon: CalendarDays },
            { label: 'Duration', value: `${tripDays(trip)} days`, icon: Clock },
            { label: 'Stops', value: String(stops.length), icon: MapPin },
            { label: 'Estimated budget', value: currency(trip.plannedBudget), icon: Wallet },
          ].map((s) => (
            <div key={s.label} className="p-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </p>
              <p className="mt-1 truncate text-sm font-bold">{s.value}</p>
            </div>
          ))}
        </Card>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Route</h2>
          {stops.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No stops yet"
              description="Add cities in the itinerary builder to see your route here."
              action={
                <Button asChild className="rounded-full">
                  <Link to={`/trips/${trip.id}`}>Open builder</Link>
                </Button>
              }
            />
          ) : (
            <ol className="space-y-3">
              {stops.map((stop, i) => {
                const city = cityById(cities, stop.cityId);
                const spent = stopActivityCost(stop);
                return (
                  <li key={stop.id}>
                    <Card className="flex flex-col gap-4 rounded-2xl border-border p-4 shadow-card sm:flex-row sm:items-center">
                      <img
                        src={city?.image}
                        alt={city?.name ?? 'Destination'}
                        loading="lazy"
                        className="h-28 w-full rounded-xl object-cover sm:h-20 sm:w-32"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">Stop {i + 1}</Badge>
                          <h3 className="truncate font-bold">{city?.name || stop.cityName}</h3>
                          <span className="truncate text-sm text-muted-foreground">{city?.country}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDate(stop.startDate)} → {formatDate(stop.endDate)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {stop.activities.length} activities · {currency(spent)} in activity costs
                        </p>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Day by day</h2>
          {days.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No activities scheduled"
              description="Add activities to your stops and they'll appear here grouped by day."
              action={
                <Button asChild className="rounded-full">
                  <Link to={`/trips/${trip.id}`}>Add activities</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {days.map((day) => (
                <Card key={day.date} className="overflow-hidden rounded-2xl border-border p-0 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/50 px-4 py-3">
                    <p className="font-semibold">{formatDate(day.date)}</p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {day.cityName}
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {day.items.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <span className="w-14 shrink-0 text-sm font-semibold tabular-nums">
                          {item.startTime}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.category} · {item.duration}h
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          {item.cost === 0 ? 'Free' : currency(item.cost)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
