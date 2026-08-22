import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Pencil, Route } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { StatusBadge } from '@/components/gt/cards';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { currency, formatRange } from '@/lib/trip-utils';
import { fetchTrip } from '@/lib/trips-api';

export function TripOverviewPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrip(id)
      .then(setTrip)
      .catch(() => toast.error('Trip not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Trip overview">
        <div className="h-72 animate-pulse rounded-2xl bg-secondary" />
      </AppShell>
    );
  }

  if (!trip) {
    return (
      <AppShell title="Trip overview">
        <Card className="rounded-2xl border-border p-8 text-center shadow-card">
          <p className="text-muted-foreground">Trip not found.</p>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/trips">Back to trips</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={trip.name}
      subtitle={formatRange(trip.startDate, trip.endDate)}
      actions={
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link to={`/trips/${trip.id}/edit`}>
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-border shadow-card">
          <img src={trip.coverImage} alt={trip.name} className="h-56 w-full object-cover sm:h-72" />
          <div className="absolute left-4 top-4">
            <StatusBadge trip={trip} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-border p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Dates</p>
            <p className="mt-1 flex items-center gap-2 font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatRange(trip.startDate, trip.endDate)}
            </p>
          </Card>
          <Card className="rounded-2xl border-border p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Stops</p>
            <p className="mt-1 flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              {trip.stops.length} {trip.stops.length === 1 ? 'city' : 'cities'}
            </p>
          </Card>
          <Card className="flex flex-col justify-between rounded-2xl border-border p-4 shadow-card">
            <div>
              <p className="text-xs text-muted-foreground">Planned budget</p>
              <p className="mt-1 font-semibold">{currency(trip.plannedBudget)}</p>
            </div>
            <Button asChild variant="link" className="mt-2 h-auto p-0 text-left text-xs font-semibold text-primary">
              <Link to={`/trips/${trip.id}/budget`}>View cost breakdown →</Link>
            </Button>
          </Card>
        </div>

        {trip.description && (
          <Card className="rounded-2xl border-border p-5 shadow-card">
            <h2 className="font-bold">About this trip</h2>
            <p className="mt-2 text-sm text-muted-foreground">{trip.description}</p>
          </Card>
        )}

        <Card className="space-y-4 rounded-2xl border-border p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-bold">Stops</h2>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/itinerary">
                <Route className="mr-1 h-4 w-4" />
                Plan itinerary
              </Link>
            </Button>
          </div>
          {trip.stops.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stops yet. Use the itinerary builder to add cities to this trip.
            </p>
          ) : (
            <ol className="space-y-3">
              {trip.stops.map((stop, index) => (
                <li
                  key={stop.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 p-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{stop.cityName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRange(stop.startDate, stop.endDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
