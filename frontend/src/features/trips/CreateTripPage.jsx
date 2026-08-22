import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useBlocker } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { CoverPhotoSelector } from '@/components/gt/CoverPhotoSelector';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const hasRecommend = Boolean(searchParams.get('recommend_city_id'));

  const [step, setStep] = useState(() => {
    if (hasRecommend) return 0;
    const local = localStorage.getItem('gt_trip_draft');
    if (local) {
      try { return JSON.parse(local).step || 0; } catch { return 0; }
    }
    return 0;
  });
  const [name, setName] = useState(() => {
    if (hasRecommend) return '';
    const local = localStorage.getItem('gt_trip_draft');
    if (local) {
      try { return JSON.parse(local).name || ''; } catch { return ''; }
    }
    return '';
  });
  const [description, setDescription] = useState(() => {
    if (hasRecommend) return '';
    const local = localStorage.getItem('gt_trip_draft');
    if (local) {
      try { return JSON.parse(local).description || ''; } catch { return ''; }
    }
    return '';
  });
  const [budgetCap, setBudgetCap] = useState(() => {
    if (hasRecommend) return '';
    const local = localStorage.getItem('gt_trip_draft');
    if (local) {
      try { return JSON.parse(local).budgetCap || ''; } catch { return ''; }
    }
    return '';
  });
  const [start, setStart] = useState(() => {
    if (hasRecommend) return '';
    const local = localStorage.getItem('gt_trip_draft');
    if (local) {
      try { return JSON.parse(local).start || ''; } catch { return ''; }
    }
    return '';
  });
  const [end, setEnd] = useState(() => {
    if (hasRecommend) return '';
    const local = localStorage.getItem('gt_trip_draft');
    if (local) {
      try { return JSON.parse(local).end || ''; } catch { return ''; }
    }
    return '';
  });
  const [cover, setCover] = useState(DEFAULT_COVER);
  const [selectedCoverId, setSelectedCoverId] = useState(null);
  const [picked, setPicked] = useState(() => {
    if (hasRecommend) return [];
    const local = localStorage.getItem('gt_trip_draft');
    if (local) {
      try { return JSON.parse(local).picked || []; } catch { return []; }
    }
    return [];
  });
  const [errors, setErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);

  // Load draft from localStorage on mount
  useEffect(() => {
    fetchAllCities()
      .then((list) => {
        setCities(list);
        
        const localDraft = localStorage.getItem('gt_trip_draft');
        let hasCover = false;
        if (localDraft && !hasRecommend) {
          try {
            const parsed = JSON.parse(localDraft);
            if (parsed.cover) {
              setCover(parsed.cover);
              setSelectedCoverId(parsed.selectedCoverId || null);
              hasCover = true;
            }
          } catch {
            // Ignore
          }
        }
        
        // Handle pre-fill from recommended city click
        const recommendCityId = parseInt(searchParams.get('recommend_city_id') || '', 10);
        if (recommendCityId) {
          const matchedCity = list.find((c) => c.id === recommendCityId);
          if (matchedCity) {
            setName(`Trip to ${matchedCity.name}`);
            setCover(matchedCity.image);
            setSelectedCoverId(matchedCity.id);
            setPicked([matchedCity.id]);
            hasCover = true;
          }
        }

        if (!hasCover && list[0]) {
          setCover(list[0].image);
          setSelectedCoverId(list[0].id);
        }
      })
      .catch((err) => toast.error(err.message || 'Failed to load cities'))
      .finally(() => setLoadingCities(false));
  }, [searchParams, hasRecommend]);

  const saveDraft = (currentStep = step) => {
    const draftData = {
      step: currentStep,
      name,
      description,
      budgetCap,
      start,
      end,
      cover,
      selectedCoverId,
      picked,
    };
    localStorage.setItem('gt_trip_draft', JSON.stringify(draftData));
  };

  const checkIsDirty = () => {
    if (saving) return false;
    const localDraft = localStorage.getItem('gt_trip_draft');
    if (!localDraft) {
      return Boolean(name.trim() || description.trim() || start || end || picked.length > 0);
    }
    try {
      const parsed = JSON.parse(localDraft);
      const nameDiff = name.trim() !== (parsed.name || '').trim();
      const descDiff = description.trim() !== (parsed.description || '').trim();
      const budgetDiff = budgetCap !== (parsed.budgetCap || '');
      const startDiff = start !== (parsed.start || '');
      const endDiff = end !== (parsed.end || '');
      const coverDiff = cover !== (parsed.cover || '');
      const selectedCoverIdDiff = selectedCoverId !== (parsed.selectedCoverId || null);
      const pickedDiff = JSON.stringify(picked.sort()) !== JSON.stringify((parsed.picked || []).sort());
      
      return nameDiff || descDiff || budgetDiff || startDiff || endDiff || coverDiff || selectedCoverIdDiff || pickedDiff;
    } catch {
      return true;
    }
  };

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      checkIsDirty() && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      toast.error('Unsafe changes! Please save your changes in the draft.');
      blocker.reset();
    }
  }, [blocker]);

  const getMinEndDate = () => {
    if (!start) return '';
    const d = new Date(start);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleBudgetChange = (e) => {
    const val = e.target.value;
    if (/^\d{0,7}$/.test(val)) {
      setBudgetCap(val);
    }
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!name.trim()) e.name = 'Give your trip a name';
      if (budgetCap && !/^\d{1,7}$/.test(budgetCap)) {
        e.budget = 'Budget must be up to 7 digits';
      }
    }
    if (step === 1) {
      if (!start) e.start = 'Pick a start date';
      if (!end) e.end = 'Pick an end date';
      if (start && end && end <= start) e.end = 'End date must be after the start date';
    }
    setErrors(e);
    if (Object.keys(e).length === 0) {
      // Auto-save draft on moving to the next step
      saveDraft(step + 1);
      return true;
    }
    return false;
  };

  const create = async (draft = false) => {
    if (draft) {
      saveDraft();
      toast.success('Draft saved locally');
      return;
    }

    if (!name.trim() || !start || !end) {
      toast.error('Add a trip name and date range first');
      return;
    }
    setSaving(true);
    try {
      const coverPhoto = cover.startsWith('blob:') ? null : cover;
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

      localStorage.removeItem('gt_trip_draft');
      toast.success("Trip created — let's build the itinerary");
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Create Trip" subtitle="Three quick steps to a working itinerary">
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
                <Label className="pl-1" htmlFor="name">Trip name</Label>
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
                <Label className="pl-1" htmlFor="desc">Description</Label>
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
                <Label className="pl-1" htmlFor="budget">Planned Budget ($) (Optional)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={budgetCap}
                  onChange={handleBudgetChange}
                  placeholder="e.g. 2500"
                  className="h-11 rounded-xl"
                />
                {errors.budget && <p className="text-xs text-destructive">{errors.budget}</p>}
              </div>
              <div className="space-y-2">
                <Label className="pl-1">Cover photo</Label>
                {loadingCities ? (
                  <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-20 w-32 shrink-0 animate-pulse rounded-xl bg-secondary/60" />
                    ))}
                  </div>
                ) : (
                  <CoverPhotoSelector
                    cities={cities}
                    cover={cover}
                    selectedCoverId={selectedCoverId}
                    onSelectCover={(imageUrl, id) => {
                      setCover(imageUrl);
                      setSelectedCoverId(id);
                      // Also auto-save to draft on cover select
                      const draftData = {
                        step,
                        name,
                        description,
                        budgetCap,
                        start,
                        end,
                        cover: imageUrl,
                        selectedCoverId: id,
                        picked,
                      };
                      localStorage.setItem('gt_trip_draft', JSON.stringify(draftData));
                    }}
                  />
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="pl-1" htmlFor="start">Start date</Label>
                <Input
                  id="start"
                  type="date"
                  value={start}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStart(newStart);
                    if (end && end <= newStart) {
                      setEnd('');
                    }
                  }}
                  className="h-11 rounded-xl"
                />
                {errors.start && <p className="text-xs text-destructive">{errors.start}</p>}
              </div>
              <div className="space-y-2">
                <Label className="pl-1" htmlFor="end">End date</Label>
                <Input
                  id="end"
                  type="date"
                  value={end}
                  min={getMinEndDate()}
                  onChange={(e) => setEnd(e.target.value)}
                  className="h-11 rounded-xl"
                />
                {errors.end && <p className="text-xs text-destructive">{errors.end}</p>}
              </div>
            </div>
          )}

          {step === 2 && (() => {
            const page = parseInt(searchParams.get('page') || '1', 10);
            const limit = parseInt(searchParams.get('limit') || '10', 10);
            const searchQuery = searchParams.get('search') || '';

            const updateParams = (newParams) => {
              const params = new URLSearchParams(searchParams);
              Object.entries(newParams).forEach(([k, v]) => {
                if (v === null || v === undefined || v === '') {
                  params.delete(k);
                } else {
                  params.set(k, String(v));
                }
              });
              setSearchParams(params);
            };

            const filteredCities = cities.filter((c) =>
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.country.toLowerCase().includes(searchQuery.toLowerCase())
            );

            const totalPages = Math.max(1, Math.ceil(filteredCities.length / limit));
            const activePage = Math.min(page, totalPages);
            const displayedCities = filteredCities.slice(
              (activePage - 1) * limit,
              activePage * limit
            );

            return (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pick the cities you want to visit. We&apos;ll split your dates evenly — you can fine-tune every stop next.
                </p>

                {/* Search & Limit Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/30 p-3 rounded-xl border border-border">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search cities by name or country..."
                      value={searchQuery}
                      onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
                      className="pl-9 h-10 rounded-lg bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Page size:</span>
                    <select
                      value={limit}
                      onChange={(e) => updateParams({ limit: e.target.value, page: 1 })}
                      className="h-10 rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* Cities Grid / Skeletons */}
                {loadingCities ? (
                  <div className="grid gap-3 sm:grid-cols-2 mt-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 animate-pulse">
                        <div className="h-14 w-16 shrink-0 rounded-xl bg-secondary/50" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 rounded bg-secondary/60" />
                          <div className="h-3 w-16 rounded bg-secondary/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayedCities.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-secondary/10 mt-4">
                    <p className="text-sm text-muted-foreground">No destinations match your search.</p>
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto pr-1 mt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {displayedCities.map((c) => {
                        const active = picked.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              const nextPicked = active ? picked.filter((x) => x !== c.id) : [...picked, c.id];
                              setPicked(nextPicked);
                              // Auto-save draft on picking cities
                              const draftData = {
                                step,
                                name,
                                description,
                                start,
                                end,
                                cover,
                                selectedCoverId,
                                picked: nextPicked,
                              };
                              localStorage.setItem('gt_trip_draft', JSON.stringify(draftData));
                            }}
                            className={cn(
                              'flex items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:shadow-sm cursor-pointer',
                              active ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary bg-card',
                            )}
                          >
                            <img
                              src={c.image}
                              alt={c.name}
                              loading="lazy"
                              className="h-14 w-16 shrink-0 rounded-xl object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">{c.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{c.country}</p>
                            </div>
                            {active && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activePage === 1}
                      onClick={() => updateParams({ page: activePage - 1 })}
                      className="h-8 w-8 rounded-full p-0 flex items-center justify-center"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                      Page {activePage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activePage === totalPages}
                      onClick={() => updateParams({ page: activePage + 1 })}
                      className="h-8 w-8 rounded-full p-0 flex items-center justify-center"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => {
                    setStep((s) => s - 1);
                    saveDraft(step - 1);
                  }}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
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
