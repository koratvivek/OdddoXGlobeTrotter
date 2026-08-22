import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { BudgetBars, BudgetDonut, BudgetSummary } from '@/components/gt/budget';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchTrip, fetchTripBudget } from '@/lib/trips-api';

export function TripBudgetPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tripData, budget] = await Promise.all([fetchTrip(id), fetchTripBudget(id)]);
        if (!cancelled) {
          // Merge budget data into trip structure expected by components
          const updatedTrip = {
            ...tripData,
            plannedBudget: budget.budget_cap ? Number(budget.budget_cap) : 0,
            budget: {
              transport: Number(budget.categories.transport),
              accommodation: Number(budget.categories.accommodation),
              activities: Number(budget.categories.activities),
              meals: Number(budget.categories.meals),
              other: Number(budget.categories.other),
            },
          };
          setTrip(updatedTrip);
          setBudgetData(budget);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.message || 'Failed to load trip budget');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Trip Budget">
        <div className="h-72 animate-pulse rounded-2xl bg-secondary" />
      </AppShell>
    );
  }

  if (!trip || !budgetData) {
    return (
      <AppShell title="Trip Budget">
        <Card className="rounded-2xl border-border p-8 text-center shadow-card">
          <p className="text-muted-foreground">Trip budget not found.</p>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/trips">Back to trips</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${trip.name} — Budget`}
      subtitle="Estimated cost breakdown for your trip"
      actions={
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to={`/trips/${trip.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Trip
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <BudgetSummary trip={trip} />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl border-border p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Category Breakdown</h3>
            <BudgetDonut trip={trip} />
          </Card>
          <Card className="rounded-2xl border-border p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Estimated vs Planned</h3>
            <BudgetBars trip={trip} />
          </Card>
        </div>

        <Card className="rounded-2xl border-border p-5 shadow-card">
          <h3 className="mb-4 font-bold">Calculation Info</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li><strong>Activities:</strong> Actual activity costs or user overrides.</li>
            <li><strong>Accommodation:</strong> Estimated from the city&apos;s cost index and number of nights.</li>
            <li><strong>Transport:</strong> Estimated at $100 flat per stop (covers inter-city transit).</li>
            <li><strong>Meals:</strong> Estimated at $50 per day.</li>
            <li><strong>Other:</strong> Currently $0 as not tracked.</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
