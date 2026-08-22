import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Clock,
  GripVertical,
  MapPin,
  Pencil,
  Plus,
  Search,
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
import { shareTripLink } from '@/lib/shares-api';
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

// Category filter constants
const ALL_CATEGORIES = ['All', 'Sightseeing', 'Food', 'Adventure', 'Culture', 'Relax', 'Nightlife'];
const PAGE_SIZE = 20;

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
  const [allOptions, setAllOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSearch('');
    setActiveCategory('All');
    setVisibleCount(PAGE_SIZE);
    fetchAllActivitiesForCity(stop.cityId)
      .then(setAllOptions)
      .catch(() => toast.error('Failed to load activities'))
      .finally(() => setLoading(false));
  }, [open, stop.cityId]);

  // Infinite scroll handler
  const handleScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
    }
  };

  const filtered = allOptions.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'All' || a.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const visible = filtered.slice(0, visibleCount);

  const add = async (activity) => {
    let dateToUse = stop.startDate;
    let timeToUse = '10:00:00';
    
    const acts = stop.activities || [];
    if (acts.length > 0) {
      const sorted = [...acts].sort((a, b) => {
        const d = a.scheduledDate.localeCompare(b.scheduledDate);
        if (d !== 0) return d;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });
      const last = sorted[sorted.length - 1];
      dateToUse = last.scheduledDate;
      const [h, m] = last.scheduledTime.split(':');
      let newH = Math.min(23, parseInt(h, 10) + 1);
      timeToUse = `${newH.toString().padStart(2, '0')}:${m}:00`;
      
      // ensure we don't conflict with existing
      while (acts.some((a) => a.scheduledDate === dateToUse && a.scheduledTime.substring(0, 5) === timeToUse.substring(0, 5))) {
        newH = Math.min(23, newH + 1);
        timeToUse = `${newH.toString().padStart(2, '0')}:${m}:00`;
        if (newH === 23) break;
      }
    }

    try {
      await createTripActivity({
        stop_id: stop.id,
        activity_id: activity.id,
        scheduled_date: dateToUse,
        scheduled_time: timeToUse,
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
        <Button size="sm" variant="outline" className="rounded-full cursor-pointer">
          <Plus className="mr-1 h-4 w-4" />
          Add activity
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background px-6 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle>Activities in {cityName}</DialogTitle>
            <DialogDescription>
              Add experiences to this stop — costs roll into your budget.
            </DialogDescription>
          </DialogHeader>
          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="activity-search"
              placeholder="Search activities…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="h-9 rounded-xl pl-9 text-sm"
            />
          </div>
          {/* Category filter pills */}
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setActiveCategory(cat); setVisibleCount(PAGE_SIZE); }}
                className={`cursor-pointer shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable activity list */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-3"
          onScroll={handleScroll}
        >
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-secondary/60" />
                    <div className="h-3 w-1/3 rounded bg-secondary/40" />
                  </div>
                  <div className="h-4 w-10 shrink-0 rounded bg-secondary/50" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {search || activeCategory !== 'All' ? 'No activities match your filters.' : 'No activities available for this city.'}
            </p>
          ) : (
            <div className="space-y-2">
              {visible.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => add(a)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-secondary"
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
              {visibleCount < filtered.length && (
                <p className="py-2 text-center text-xs text-muted-foreground">Scroll to load more…</p>
              )}
            </div>
          )}
        </div>
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
    const target = sortedActivities.find((a) => a.id === taId);
    const dateToCheck = payload.scheduled_date || target.scheduledDate;
    const timeToCheck = payload.scheduled_time || target.scheduledTime;
    
    const conflict = sortedActivities.find((a) => 
      a.id !== taId && 
      a.scheduledDate === dateToCheck && 
      a.scheduledTime.substring(0, 5) === timeToCheck.substring(0, 5)
    );
    
    if (conflict) {
      toast.error('Another activity is already scheduled at this time');
      return;
    }

    try {
      await updateTripActivity(taId, payload);
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to update activity');
    }
  };

  // eslint-disable-next-line no-unused-vars
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

  const handleDragStart = (e, idx) => {
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIdx) => {
    e.preventDefault();
    const dragIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(dragIdx) || dragIdx === dropIdx) return;
    
    const source = sortedActivities[dragIdx];
    const target = sortedActivities[dropIdx];
    if (!source || !target) return;

    try {
      await updateTripActivity(source.id, {
        scheduled_date: target.scheduledDate,
        scheduled_time: target.scheduledTime.length === 5 ? `${target.scheduledTime}:00` : target.scheduledTime,
      });
      await updateTripActivity(target.id, {
        scheduled_date: source.scheduledDate,
        scheduled_time: source.scheduledTime.length === 5 ? `${source.scheduledTime}:00` : source.scheduledTime,
      });
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Failed to reorder activity');
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
            <div 
              key={ta.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, i)}
              className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary/60 p-3 transition-opacity cursor-grab active:cursor-grabbing hover:bg-secondary/80"
            >
              <div className="flex items-center text-muted-foreground/50 hover:text-foreground shrink-0 cursor-grab px-1">
                <GripVertical className="h-4 w-4" />
              </div>
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
  const navigate = useNavigate();
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
    return <TripOverviewSkeleton />;
  }

  if (notFound || !trip) return <TripNotFound title="Itinerary Builder" />;

  const stops = [...trip.stops].sort((a, b) => a.orderIndex - b.orderIndex);
  const stopsWithSiblings = stops.map((s, i) => ({ ...s, _siblings: stops, _index: i }));

  const share = async () => {
    try {
      const { slug } = await shareTripLink(id);
      toast.success('Public link copied to clipboard');
      navigate(`/share/${slug}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create share link');
    }
  };

  return (
    <AppShell
      title={trip.name}
      subtitle={`${formatRange(trip.startDate, trip.endDate)} · ${stops.length} destinations`}
      actions={
        <>
          <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
            <Link to={`/trips/${trip.id}/edit`}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
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

export function TripOverviewSkeleton() {
  return (
    <AppShell title="Trip overview" subtitle="..." actions={
      <div className="h-8 w-20 bg-secondary/60 animate-pulse rounded-full" />
    }>
      <div className="space-y-6 animate-pulse">
        {/* Large cover image placeholder */}
        <div className="h-56 w-full rounded-3xl bg-secondary/40 sm:h-72" />

        {/* 3 summary cards grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl border border-border p-4 shadow-card space-y-2 bg-card">
              <div className="h-3.5 w-16 bg-secondary/50 rounded" />
              <div className="h-5 w-24 bg-secondary/60 rounded" />
            </Card>
          ))}
        </div>

        {/* Description placeholder */}
        <Card className="rounded-2xl border border-border p-5 shadow-card space-y-2.5 bg-card">
          <div className="h-4.5 w-28 bg-secondary/65 rounded" />
          <div className="h-3.5 w-full bg-secondary/45 rounded" />
          <div className="h-3.5 w-5/6 bg-secondary/45 rounded" />
        </Card>

        {/* Stops list card placeholder */}
        <Card className="rounded-2xl border border-border p-5 shadow-card space-y-4 bg-card">
          <div className="flex justify-between items-center">
            <div className="h-5 w-20 bg-secondary/65 rounded" />
            <div className="h-8 w-28 bg-secondary/70 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-3 bg-secondary/10">
                <div className="h-8 w-8 rounded-full bg-secondary/50 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-secondary/55 rounded" />
                  <div className="h-3 w-20 bg-secondary/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
