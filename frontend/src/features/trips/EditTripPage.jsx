import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { fetchAllCities, fetchTrip, updateTrip } from '@/lib/trips-api';

export function EditTripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTrip(id), fetchAllCities()])
      .then(([t, cityList]) => {
        setTrip(t);
        setCities(cityList);
      })
      .catch(() => toast.error('Trip not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Edit trip">
        <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
      </AppShell>
    );
  }

  if (!trip) {
    return (
      <AppShell title="Edit trip">
        <Card className="rounded-2xl border-border p-8 text-center shadow-card">
          <p className="text-muted-foreground">Trip not found.</p>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/trips">Back to trips</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  return <EditTripForm key={trip.id} trip={trip} cities={cities} onSaved={() => navigate(`/trips/${trip.id}`)} />;
}

function EditTripForm({ trip, cities, onSaved }) {
  const [name, setName] = useState(trip.name);
  const [description, setDescription] = useState(trip.description);
  const [start, setStart] = useState(trip.startDate);
  const [end, setEnd] = useState(trip.endDate);
  const [cover, setCover] = useState(trip.coverImage);
  const [planned, setPlanned] = useState(String(trip.plannedBudget));
  const [isPublic, setIsPublic] = useState(trip.isPublic);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const e = {};
    if (!name.trim()) e.name = 'Give your trip a name';
    if (!start) e.start = 'Pick a start date';
    if (!end) e.end = 'Pick an end date';
    if (start && end && end < start) e.end = 'End date must be after the start date';
    if (Number(planned) < 0 || Number.isNaN(Number(planned))) e.budget = 'Enter a valid budget';
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setSaving(true);
    try {
      const coverPhoto = cover.startsWith('blob:') ? trip.coverImage : cover;
      await updateTrip(trip.id, {
        name: name.trim(),
        description: description.trim() || null,
        start_date: start,
        end_date: end,
        cover_photo: coverPhoto,
        budget_cap: Number(planned),
        is_public: isPublic,
      });
      toast.success('Trip updated');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Failed to update trip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Edit trip"
      subtitle={trip.name}
      actions={
        <Button asChild size="sm" variant="ghost" className="rounded-full">
          <Link to={`/trips/${trip.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="space-y-5 rounded-2xl border-border p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-bold">Trip basics</h2>
          <div className="space-y-2">
            <Label htmlFor="trip-name">Trip name</Label>
            <Input
              id="trip-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
              placeholder="European Summer Loop"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="trip-desc">Description</Label>
            <Textarea
              id="trip-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl"
              placeholder="What's the plan for this trip?"
            />
          </div>
        </Card>

        <Card className="space-y-5 rounded-2xl border-border p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-bold">Dates & budget</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trip-start">Start date</Label>
              <Input
                id="trip-start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-11 rounded-xl"
              />
              {errors.start && <p className="text-xs text-destructive">{errors.start}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip-end">End date</Label>
              <Input
                id="trip-end"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-11 rounded-xl"
              />
              {errors.end && <p className="text-xs text-destructive">{errors.end}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trip-budget">Planned budget (USD)</Label>
            <Input
              id="trip-budget"
              type="number"
              min={0}
              value={planned}
              onChange={(e) => setPlanned(e.target.value)}
              className="h-11 rounded-xl"
            />
            {errors.budget && <p className="text-xs text-destructive">{errors.budget}</p>}
          </div>
        </Card>

        <Card className="space-y-4 rounded-2xl border-border p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-bold">Cover photo</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cities.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCover(c.image)}
                aria-label={`Use ${c.name} as cover photo`}
                aria-pressed={cover === c.image}
                className={cn(
                  'relative overflow-hidden rounded-xl border-2 transition-colors',
                  cover === c.image ? 'border-primary' : 'border-transparent hover:border-border',
                )}
              >
                <img src={c.image} alt={c.name} loading="lazy" className="h-24 w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-foreground/55 px-2 py-1 text-left text-xs font-medium text-background">
                  {c.name}
                </span>
                {cover === c.image && (
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex items-center justify-between gap-4 rounded-2xl border-border p-5 shadow-card sm:p-6">
          <div className="min-w-0">
            <Label htmlFor="trip-public" className="text-base font-bold">
              Public itinerary
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Anyone with the share link can view this trip in read-only mode.
            </p>
          </div>
          <Switch id="trip-public" checked={isPublic} onCheckedChange={setIsPublic} aria-label="Make trip public" />
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to={`/trips/${trip.id}`}>Cancel</Link>
          </Button>
          <Button className="rounded-full" disabled={saving} onClick={save}>
            <Check className="mr-1 h-4 w-4" />
            Save changes
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
