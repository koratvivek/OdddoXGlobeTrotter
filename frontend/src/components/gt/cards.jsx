import { Link } from 'react-router-dom';
import { CalendarDays, Clock, Heart, MapPin, Star, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { clampCostIndex } from '@/lib/city-meta';
import {
  budgetTotal,
  currency,
  formatRange,
  tripDays,
  tripProgress,
  tripStatus,
} from '@/lib/trip-utils';
import { cn } from '@/lib/utils';

export function StatusBadge({ trip }) {
  const status = tripStatus(trip);
  const styles = {
    ongoing: 'bg-success/12 text-success border-success/25',
    upcoming: 'bg-primary/10 text-primary border-primary/20',
    completed: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <Badge variant="outline" className={cn('capitalize', styles[status])}>
      {status}
    </Badge>
  );
}

export function TripCard({ trip, actions }) {
  const status = tripStatus(trip);
  const destinations =
    trip.stops.map((s) => s.cityName).filter(Boolean).join(' · ') || 'No stops yet';
  return (
    <Card className="group overflow-hidden rounded-2xl border-border p-0 shadow-card transition-shadow hover:shadow-lg">
      <div className="relative h-40 overflow-hidden">
        <img
          src={trip.coverImage}
          alt={trip.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <StatusBadge trip={trip} />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{trip.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{destinations}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatRange(trip.startDate, trip.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'}
          </span>
          <span className="flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" />
            {currency(budgetTotal(trip.budget) || trip.plannedBudget)}
          </span>
        </div>
        {status === 'ongoing' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Trip progress</span>
              <span>{tripProgress(trip)}%</span>
            </div>
            <Progress value={tripProgress(trip)} className="h-1.5" />
          </div>
        )}
        <div className="flex items-center gap-2 pt-1">
          <Button asChild size="sm" className="rounded-full">
            <Link to={`/trips/${trip.id}`}>View Trip</Link>
          </Button>
          {actions}
        </div>
      </div>
    </Card>
  );
}

export function DestinationCard({ city, saved, onSave, onAdd, className }) {
  const costIndex = clampCostIndex(city.costIndex ?? city.cost_index);
  const emptyCost = Math.max(0, 5 - costIndex);

  return (
    <Card className={cn('group overflow-hidden rounded-2xl border-border p-0 shadow-card', className)}>
      <div className="relative h-36 overflow-hidden">
        <img
          src={city.image_url || city.image}
          alt={`${city.name}, ${city.country}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            aria-label={saved ? 'Remove from saved' : 'Save destination'}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/85 backdrop-blur transition-colors hover:bg-background"
          >
            <Heart className={cn('h-4 w-4', saved ? 'fill-accent text-accent' : 'text-foreground')} />
          </button>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold">{city.name}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {city.country}
              {city.region ? ` · ${city.region}` : ''}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {city.popularity_score || city.popularity}
          </Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{city.description}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-medium text-muted-foreground">
            Cost index {'$'.repeat(costIndex)}
            <span className="text-border">{'$'.repeat(emptyCost)}</span>
          </span>
          {onAdd && (
            <Button size="sm" variant="outline" className="rounded-full" onClick={onAdd}>
              Add to Trip
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ActivityCard({ activity, city, onAdd }) {
  return (
    <Card className="flex flex-col gap-3 rounded-2xl border-border p-4 shadow-card sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{activity.name}</h3>
          <Badge variant="secondary">{activity.category || activity.type}</Badge>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{activity.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{city.name}, {city.country}</span>}
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{activity.duration}h</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
        <span className="text-base font-bold">{activity.cost === 0 ? "Free" : currency(activity.cost)}</span>
        {onAdd && (
          <Button size="sm" className="rounded-full" onClick={onAdd}>
            Add to Trip
          </Button>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingGrid({ count = 3 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/12 text-accent',
    success: 'bg-success/12 text-success',
    warning: 'bg-warning/20 text-warning-foreground',
  };
  return (
    <Card className="rounded-2xl border-border p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}

export function tripDaysLabel(trip) {
  return `${tripDays(trip)} days`;
}
