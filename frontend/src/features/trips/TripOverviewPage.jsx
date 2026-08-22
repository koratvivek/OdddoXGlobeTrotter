import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Share2,
  Trash2,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { EmptyState } from '@/components/gt/cards';
import { TripNotFound } from '@/components/gt/trip-not-found';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cityById } from '@/lib/city-meta';
import {
  activityHours,
  currency,
  formatRange,
  stopActivityCost,
  tripDays,
} from '@/lib/trip-utils';
import {
  createStop,
  createTripActivity,
  deleteStop,
  deleteTripActivity,
  fetchAllActivitiesForCity,
  fetchAllCities,
  fetchTripWithItinerary,
  updateStop,
  updateTripActivity,
} from '@/lib/trips-api';

function AddStopDialog({ trip, cities, onAdded }) {
  const [open, setOpen] = useState(false);
  const [cityId, setCityId] = useState('');
  const [arrival, setArrival] = useState(trip.startDate);
  const [departure, setDeparture] = useState(trip.endDate);

  useEffect(() => {
    if (cities.length && !cityId) setCityId(String(cities[0].id));
  }, [cities, cityId]);

  const submit = async () => {
    try {
      await createStop({
        trip_id: Number(trip.id),
        city_id: Number(cityId),
        start_date: arrival,
        end_date: departure,
      });
      const city = cityById(cities, Number(cityId));
      toast.success(`${city?.name || 'City'} added to your trip`);
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(err.message || 'Failed to add stop');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full rounded-2xl border-dashed py-6">
          <Plus className="mr-2 h-4 w-4" />
          Add another stop
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a stop</DialogTitle>
          <DialogDescription>Choose a city and the dates you&apos;ll be there.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}, {c.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Arrival</Label>
              <Input
                type="date"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Departure</Label>
              <Input
                type="date"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <Button className="w-full rounded-full" onClick={submit}>
            Add stop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddActivityDialog({ stop, cityName, onAdded }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchAllActivitiesForCity(stop.cityId)
      .then(setOptions)
      .catch(() => toast.error('Failed to load activities'))
      .finally(() => setLoading(false));
  }, [open, stop.cityId]);

  const add = async (activity) => {
    try {
      await createTripActivity({
        stop_id: stop.id,
        activity_id: activity.id,
        scheduled_date: stop.startDate,
        scheduled_time: '10:00:00',
      });
      toast.success(`${activity.name} added`);
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(err.message || 'Failed to add activity');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full">
          <Plus className="mr-1 h-4 w-4" />
          Add activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activities in {cityName}</DialogTitle>
          <DialogDescription>
            Add experiences to this stop — costs roll into your budget.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading activities…</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activities available for this city.</p>
        ) : (
          <div className="space-y-2">
            {options.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => add(a)}
                className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.category} · {a.durationHours}h
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {a.cost === 0 ? 'Free' : currency(a.cost)}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StopCard({ stop, index, total, cities, onChanged }) {
  const city = cityById(cities, stop.cityId);
  const days = Math.max(
    1,
    Math.round((new Date(stop.endDate).getTime() - new Date(stop.startDate).getTime()) / 86400000),
  );
  const spent = stopActivityCost(stop);
  const sortedActivities = [...(stop.activities || [])].sort((a, b) => {
    const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
    if (dateCmp !== 0) return dateCmp;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  const patchStop = async (payload) => {
    try {
      await updateStop(stop.id, payload);
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to update stop');
    }
  };

  const handleMove = async (dir) => {
    const neighborIndex = index + dir;
    if (neighborIndex < 0 || neighborIndex >= total) return;
    try {
      const neighbor = stop._siblings?.[neighborIndex];
      if (!neighbor) return;
      await updateStop(stop.id, { order_index: neighbor.orderIndex });
      await updateStop(neighbor.id, { order_index: stop.orderIndex });
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to reorder stop');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStop(stop.id);
      toast.success('Stop removed');
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to remove stop');
    }
  };

  const patchActivity = async (taId, payload) => {
    try {
      await updateTripActivity(taId, payload);
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to update activity');
    }
  };

  const moveActivity = async (ta, dir, i) => {
    const j = i + dir;
    if (j < 0 || j >= sortedActivities.length) return;
    const other = sortedActivities[j];
    try {
      await updateTripActivity(ta.id, {
        scheduled_date: other.scheduledDate,
        scheduled_time: `${other.scheduledTime}:00`,
      });
      await updateTripActivity(other.id, {
        scheduled_date: ta.scheduledDate,
        scheduled_time: `${ta.scheduledTime}:00`,
      });
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to reorder activity');
    }
  };

  const removeActivity = async (taId) => {
    try {
      await deleteTripActivity(taId);
      toast.success('Activity removed');
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to remove activity');
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-card">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row">
        <img
          src={city?.image}
          alt={city?.name}
          loading="lazy"
          className="h-32 w-full rounded-xl object-cover sm:h-24 sm:w-36"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Stop {index + 1}</Badge>
            <h3 className="text-lg font-bold">{city?.name || stop.cityName}</h3>
            <span className="text-sm text-muted-foreground">{city?.country}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Arrival</Label>
              <Input
                type="date"
                value={stop.startDate}
                onChange={(e) => patchStop({ start_date: e.target.value })}
                className="h-9 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Departure</Label>
              <Input
                type="date"
                value={stop.endDate}
                onChange={(e) => patchStop({ end_date: e.target.value })}
                className="h-9 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City</Label>
              <Select
                value={String(stop.cityId)}
                onValueChange={(v) => patchStop({ city_id: Number(v) })}
              >
                <SelectTrigger className="h-9 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {days} days · {stop.activities.length} activities · {currency(spent)} in activity costs
          </p>
        </div>
        <div className="flex shrink-0 gap-1 sm:flex-col">
          <Button
            size="icon"
            variant="ghost"
            disabled={index === 0}
            onClick={() => handleMove(-1)}
            aria-label="Move stop up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={index === total - 1}
            onClick={() => handleMove(1)}
            aria-label="Move stop down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleDelete} aria-label="Remove stop">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 p-4">
        {sortedActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activities yet for this stop.</p>
        ) : (
          sortedActivities.map((ta, i) => (
            <div key={ta.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary/60 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{ta.activityName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ta.category} · {activityHours(ta.duration)}h · {currency(ta.estimatedCost)}
                </p>
              </div>
              <Input
                type="date"
                value={ta.scheduledDate}
                onChange={(e) => patchActivity(ta.id, { scheduled_date: e.target.value })}
                className="h-8 w-36 rounded-lg text-xs"
              />
              <Input
                type="time"
                value={ta.scheduledTime}
                onChange={(e) => patchActivity(ta.id, { scheduled_time: `${e.target.value}:00` })}
                className="h-8 w-24 rounded-lg text-xs"
              />
              <div className="flex shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={i === 0}
                  onClick={() => moveActivity(ta, -1, i)}
                  aria-label="Move activity up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={i === sortedActivities.length - 1}
                  onClick={() => moveActivity(ta, 1, i)}
                  aria-label="Move activity down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => removeActivity(ta.id)}
                  aria-label="Remove activity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
        <AddActivityDialog stop={stop} cityName={city?.name || stop.cityName} onAdded={onChanged} />
      </div>
    </Card>
  );
}

export function TripOverviewPage() {
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
      <AppShell title="Itinerary Builder">
        <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
      </AppShell>
    );
  }

  if (notFound || !trip) return <TripNotFound title="Itinerary Builder" />;

  const stops = [...trip.stops].sort((a, b) => a.orderIndex - b.orderIndex);
  const stopsWithSiblings = stops.map((s, i) => ({ ...s, _siblings: stops, _index: i }));

  const share = () => {
    toast.info('Sharing comes in a later phase');
  };

  return (
    <AppShell
      title={trip.name}
      subtitle={`${formatRange(trip.startDate, trip.endDate)} · ${stops.length} destinations`}
      actions={
        <>
          <Button asChild size="sm" variant="ghost" className="hidden rounded-full sm:inline-flex">
            <Link to={`/trips/${trip.id}/edit`}>Edit trip</Link>
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={share}>
            <Share2 className="mr-1 h-4 w-4" />
            Share
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-card">
          <div className="relative h-40 sm:h-52">
            <img src={trip.coverImage} alt={trip.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-background">
              <h2 className="text-2xl font-extrabold">{trip.name}</h2>
              <p className="text-sm opacity-90">{trip.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border border-t border-border sm:grid-cols-4">
            {[
              { label: 'Dates', value: formatRange(trip.startDate, trip.endDate), icon: CalendarDays },
              { label: 'Duration', value: `${tripDays(trip)} days`, icon: Clock },
              { label: 'Destinations', value: String(stops.length), icon: MapPin },
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
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="rounded-full">
            <Link to={`/trips/${trip.id}/itinerary`}>Day-by-day view</Link>
          </Button>
          <Button asChild variant="secondary" className="rounded-full">
            <Link to={`/trips/${trip.id}/budget`}>Budget & costs</Link>
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Stops</h2>
          {stops.length === 0 && (
            <EmptyState
              icon={MapPin}
              title="No stops yet"
              description="Add your first city to start building the itinerary."
            />
          )}
          {stopsWithSiblings.map((stop, i) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={i}
              total={stops.length}
              cities={cities}
              onChanged={load}
            />
          ))}
          <AddStopDialog trip={trip} cities={cities} onAdded={load} />
        </div>
      </div>
    </AppShell>
  );
}
