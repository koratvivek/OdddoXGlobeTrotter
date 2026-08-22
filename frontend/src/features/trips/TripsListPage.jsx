import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, Map, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { EmptyState, LoadingGrid, StatusBadge, TripCard } from '@/components/gt/cards';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { budgetTotal, currency, formatRange } from '@/lib/trip-utils';
import { deleteTrip, fetchTrips } from '@/lib/trips-api';

function DeleteTripButton({ trip, onDeleted }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Delete trip">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{trip.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the trip, its stops and all planned activities. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              try {
                await deleteTrip(trip.id);
                onDeleted();
                toast.success('Trip deleted');
              } catch (err) {
                toast.error(err.message || 'Failed to delete trip');
              }
            }}
          >
            Delete trip
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TripRow({ trip, onDeleted }) {
  const destinations =
    trip.stops.map((s) => s.cityName).filter(Boolean).join(' · ') || 'No stops yet';
  return (
    <Card className="flex flex-col gap-4 rounded-2xl border-border p-3 shadow-card sm:flex-row sm:items-center">
      <img
        src={trip.coverImage}
        alt={trip.name}
        loading="lazy"
        className="h-28 w-full rounded-xl object-cover sm:h-20 sm:w-32"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-bold">{trip.name}</h3>
          <StatusBadge trip={trip} />
        </div>
        <p className="truncate text-sm text-muted-foreground">{destinations}</p>
        <p className="text-xs text-muted-foreground">
          {formatRange(trip.startDate, trip.endDate)} · {trip.stops.length} stops ·{' '}
          {currency(budgetTotal(trip.budget) || trip.plannedBudget)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm" className="rounded-full">
          <Link to={`/trips/${trip.id}`}>View</Link>
        </Button>
        <Button asChild size="icon" variant="ghost" aria-label="Edit trip">
          <Link to={`/trips/${trip.id}/edit`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <DeleteTripButton trip={trip} onDeleted={onDeleted} />
      </div>
    </Card>
  );
}

export function TripsListPage() {
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const pageSize = 9;

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchTrips({
        page,
        pageSize,
        q: query.trim() || undefined,
        status: tab,
        sort,
      });
      setData(result);
    } catch (err) {
      toast.error(err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query, tab, sort]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleTabChange = (value) => {
    setTab(value);
    setPage(1);
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  const pages = Array.from({ length: data.total_pages }, (_, i) => i + 1);

  return (
    <AppShell
      title="My Trips"
      subtitle="Ongoing, upcoming and completed adventures"
      actions={
        <Button asChild size="sm" className="rounded-full">
          <Link to="/trips/new">
            <Plus className="mr-1 h-4 w-4" />
            Plan a Trip
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="rounded-full">
              <TabsTrigger value="all" className="rounded-full">
                All
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="rounded-full">
                Ongoing
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="rounded-full">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-full">
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={query}
              onChange={handleQueryChange}
              placeholder="Search trips or cities…"
              className="h-10 w-full rounded-full sm:w-56"
            />
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="h-10 w-36 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by date</SelectItem>
                <SelectItem value="name">Sort by name</SelectItem>
                <SelectItem value="budget">Sort by budget</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-full border border-border p-0.5">
              <Button
                size="icon"
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                className="h-9 w-9 rounded-full"
                onClick={() => setView('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={view === 'list' ? 'secondary' : 'ghost'}
                className="h-9 w-9 rounded-full"
                onClick={() => setView('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingGrid count={6} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Map}
            title={query ? 'No trips match your search' : 'Nothing here yet'}
            description={
              query ? 'Try a different trip name or city.' : 'Plan a new trip to fill this section.'
            }
            action={
              <Button asChild className="rounded-full">
                <Link to="/trips/new">Plan a Trip</Link>
              </Button>
            }
          />
        ) : view === 'grid' ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                actions={
                  <>
                    <Button asChild size="icon" variant="ghost" aria-label="Edit trip">
                      <Link to={`/trips/${t.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteTripButton trip={t} onDeleted={loadTrips} />
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((t) => (
              <TripRow key={t.id} trip={t} onDeleted={loadTrips} />
            ))}
          </div>
        )}

        {data.total_pages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={page <= 1}
                  onClick={() => page > 1 && setPage((p) => p - 1)}
                />
              </PaginationItem>
              {pages.map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  disabled={page >= data.total_pages}
                  onClick={() => page < data.total_pages && setPage((p) => p + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </AppShell>
  );
}
