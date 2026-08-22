import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_COVER } from '@/lib/city-meta';
import { cn } from '@/lib/utils';
import { createStop, createTrip, fetchAllCities } from '@/lib/trips-api';

const steps = ['Trip basics', 'Dates', 'Destinations'];

export function CreateTripPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budgetCap, setBudgetCap] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [cover, setCover] = useState(DEFAULT_COVER);
  const [picked, setPicked] = useState([]);
  const [errors, setErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllCities()
      .then((list) => {
        setCities(list);
        if (list[0]) setCover(list[0].image);
      })
      .catch((err) => toast.error(err.message || 'Failed to load cities'));
  }, []);

  const validateStep = () => {
    const e = {};
    if (step === 0 && !name.trim()) e.name = 'Give your trip a name';
    if (step === 1) {
      if (!start) e.start = 'Pick a start date';
      if (!end) e.end = 'Pick an end date';
      if (start && end && end < start) e.end = 'End date must be after the start date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const create = async (draft = false) => {
    if (!name.trim() || !start || !end) {
      toast.error('Add a trip name and date range first');
      return;
    }
    setSaving(true);
    try {
      const coverPhoto = cover.startsWith('blob:') ? cities.find((c) => c.image === cover)?.image || null : cover;
      const trip = await createTrip({
        name: name.trim(),
        description: description.trim() || null,
        start_date: start,
        end_date: end,
        cover_photo: coverPhoto,
        is_public: false,
        budget_cap: budgetCap ? Number(budgetCap) : null,
      });

      const daysPerStop = Math.max(
        1,
        Math.floor(
          (new Date(end).getTime() - new Date(start).getTime()) /
            86400000 /
            Math.max(1, picked.length || 1),
        ),
      );

      for (let i = 0; i < picked.length; i += 1) {
        const cityId = picked[i];
        const arrival = new Date(start);
        arrival.setDate(arrival.getDate() + i * daysPerStop);
        const departure = new Date(arrival);
        departure.setDate(departure.getDate() + daysPerStop);
        await createStop({
          trip_id: Number(trip.id),
          city_id: cityId,
          start_date: arrival.toISOString().slice(0, 10),
          end_date: departure.toISOString().slice(0, 10),
          order_index: i,
        });
      }

      toast.success(draft ? 'Draft saved' : "Trip created — let's build the itinerary");
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Plan a new trip" subtitle="Three quick steps to a working itinerary">
      <div className="mx-auto max-w-3xl space-y-6">
        <ol className="grid grid-cols-3 gap-2">
          {steps.map((s, i) => (
            <li key={s} className="space-y-2">
              <div className={cn('h-1.5 rounded-full', i <= step ? 'bg-primary' : 'bg-border')} />
              <p className={cn('text-xs font-medium', i <= step ? 'text-primary' : 'text-muted-foreground')}>
                {i + 1}. {s}
              </p>
            </li>
          ))}
        </ol>

        <Card className="space-y-6 rounded-2xl border-border p-6 shadow-card">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Trip name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="European Summer Loop"
                  className="h-11 rounded-xl"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's the plan? Museums, food, mountain days…"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Planned Budget ($) (Optional)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={budgetCap}
                  onChange={(e) => setBudgetCap(e.target.value)}
                  placeholder="e.g. 2500"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Cover photo</Label>
                <div className="scroll-row">
                  {cities.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCover(c.image)}
                      className={cn(
                        'relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border-2 transition-colors',
                        cover === c.image ? 'border-primary' : 'border-transparent',
                      )}
                    >
                      <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                      {cover === c.image && (
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  ))}
                  <label className="grid h-20 w-32 shrink-0 cursor-pointer place-items-center rounded-xl border border-dashed border-border text-muted-foreground">
                    <ImagePlus className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setCover(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Start date</Label>
                <Input
                  id="start"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="h-11 rounded-xl"
                />
                {errors.start && <p className="text-xs text-destructive">{errors.start}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End date</Label>
                <Input
                  id="end"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="h-11 rounded-xl"
                />
                {errors.end && <p className="text-xs text-destructive">{errors.end}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pick the cities you want to visit. We&apos;ll split your dates evenly — you can fine-tune every
                stop next.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {cities.map((c) => {
                  const active = picked.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setPicked((p) => (active ? p.filter((x) => x !== c.id) : [...p, c.id]))
                      }
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                        active ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary',
                      )}
                    >
                      <img
                        src={c.image}
                        alt={c.name}
                        loading="lazy"
                        className="h-14 w-16 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.country}</p>
                      </div>
                      {active && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="ghost" className="rounded-full" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
              <Button asChild variant="ghost" className="rounded-full">
                <Link to="/trips">Cancel</Link>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={saving}
                onClick={() => create(true)}
              >
                Save draft
              </Button>
              {step < 2 ? (
                <Button className="rounded-full" onClick={() => validateStep() && setStep((s) => s + 1)}>
                  Continue
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button className="rounded-full" disabled={saving} onClick={() => create(false)}>
                  Create trip
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
