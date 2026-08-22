import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Clock, Globe2, Link2, MapPin, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { activityHours, budgetTotal, currency, formatDate, formatRange, tripDays } from '@/lib/trip-utils';
import { fetchPublicShare } from '@/lib/shares-api';

export function SharePage() {
  const { slug } = useParams();
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPublicShare(slug);
        if (!cancelled) setShare(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading itinerary…
      </div>
    );
  }

  if (notFound || !share) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-extrabold">Itinerary unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This shared link is no longer valid or the trip was deleted.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/dashboard">Go to GlobeTrotter</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stops = [...share.stops].sort((a, b) => a.orderIndex - b.orderIndex);
  const total = share.budget?.totalCost || budgetTotal(share.budget);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Globe2 className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">GlobeTrotter</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href);
              toast.success('Link copied');
            }}
          >
            <Link2 className="mr-1 h-4 w-4" />
            Copy link
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-card">
          <img src={share.coverImage} alt={share.name} className="h-60 w-full object-cover" />
          <div className="space-y-3 p-6">
            <Badge variant="secondary">Read-only itinerary</Badge>
            <h1 className="text-3xl font-extrabold tracking-tight">{share.name}</h1>
            <p className="text-sm text-muted-foreground">{share.description}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatRange(share.startDate, share.endDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {tripDays(share)} days
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {stops.length} stops
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                {currency(total)}
              </span>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Itinerary</h2>
          {stops.length === 0 ? (
            <Card className="rounded-2xl border-border p-6 text-sm text-muted-foreground shadow-card">
              No stops have been added to this trip yet.
            </Card>
          ) : (
            stops.map((stop, i) => {
              const acts = [...stop.activities].sort(
                (a, b) =>
                  a.scheduledDate.localeCompare(b.scheduledDate) ||
                  a.scheduledTime.localeCompare(b.scheduledTime),
              );
              return (
                <Card key={stop.id} className="space-y-4 rounded-2xl border-border p-5 shadow-card">
                  <div className="flex items-start gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <img
                      src={stop.cityImage}
                      alt={stop.cityName}
                      loading="lazy"
                      className="h-16 w-24 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold">{stop.cityName || 'Unknown city'}</h3>
                      <p className="truncate text-sm text-muted-foreground">{stop.cityCountry}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(stop.startDate)} → {formatDate(stop.endDate)}
                      </p>
                    </div>
                  </div>

                  {acts.length > 0 && (
                    <ul className="space-y-2 border-t border-border pt-4">
                      {acts.map((ta) => (
                        <li key={ta.id} className="flex items-start gap-3 rounded-xl bg-secondary/60 p-3">
                          <span className="shrink-0 text-xs font-semibold text-primary">
                            {ta.scheduledTime}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ta.activityName || 'Activity'}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatDate(ta.scheduledDate)}
                              {ta.category ? ` · ${ta.category} · ${activityHours(ta.duration)}h` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {currency(ta.estimatedCost)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })
          )}
        </section>

        <Card className="space-y-3 rounded-2xl border-border p-5 shadow-card">
          <h2 className="text-base font-bold">Budget breakdown</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(share.budget)
              .filter(([key]) => key !== 'totalCost')
              .map(([key, value]) => (
                <li key={key} className="flex items-center justify-between">
                  <span className="capitalize text-muted-foreground">{key}</span>
                  <span className="font-medium">{currency(value)}</span>
                </li>
              ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold">
            <span>Total</span>
            <span>{currency(total)}</span>
          </div>
        </Card>

        <div className="rounded-2xl bg-primary/8 p-6 text-center">
          <p className="text-sm font-semibold">Like this trip?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan your own multi-city itinerary with GlobeTrotter.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/signup">Get started free</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
