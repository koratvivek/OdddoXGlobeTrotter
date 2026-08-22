import { AlertTriangle } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { budgetTotal, currency, tripDays } from '@/lib/trip-utils';

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export function budgetSlices(trip) {
  const b = trip.budget;
  return [
    { name: 'Transport', value: b.transport },
    { name: 'Accommodation', value: b.accommodation },
    { name: 'Activities', value: b.activities },
    { name: 'Meals', value: b.meals },
    { name: 'Other', value: b.other },
  ];
}

export function BudgetDonut({ trip, height = 240 }) {
  const data = budgetSlices(trip).filter((d) => d.value > 0);
  const total = budgetTotal(trip.budget);
  const displayTotal = total > 0 ? total : trip.plannedBudget;

  if (data.length === 0) {
    return (
      <div
        className="relative grid place-items-center rounded-xl bg-secondary/50"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Planned budget</p>
          <p className="text-xl font-extrabold">{currency(trip.plannedBudget)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Category breakdown in Phase 5</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, n) => [currency(v), n]}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--card)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Estimated</p>
          <p className="text-xl font-extrabold">{currency(displayTotal)}</p>
        </div>
      </div>
    </div>
  );
}

export function BudgetBars({ trip, height = 220 }) {
  const data = budgetSlices(trip);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            interval={0}
            tick={{ fill: 'var(--muted-foreground)' }}
          />
          <YAxis tickLine={false} axisLine={false} fontSize={11} tick={{ fill: 'var(--muted-foreground)' }} />
          <Tooltip
            cursor={{ fill: 'var(--secondary)' }}
            formatter={(v) => currency(v)}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--card)',
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetSummary({ trip }) {
  const total = budgetTotal(trip.budget);
  const remaining = trip.plannedBudget - total;
  const used = trip.plannedBudget > 0 ? Math.round((total / trip.plannedBudget) * 100) : 0;
  const perDay = Math.round((total || trip.plannedBudget) / tripDays(trip));
  const over = remaining < 0;

  return (
    <Card className="space-y-4 rounded-2xl border-border p-5 shadow-card">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Planned budget</p>
          <p className="text-xl font-extrabold">{currency(trip.plannedBudget)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estimated total</p>
          <p className="text-xl font-extrabold">{currency(total || trip.plannedBudget)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{over ? 'Over budget' : 'Remaining'}</p>
          <p className={`text-xl font-extrabold ${over ? 'text-destructive' : 'text-success'}`}>
            {currency(Math.abs(remaining))}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg. cost / day</p>
          <p className="text-xl font-extrabold">{currency(perDay)}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Budget used</span>
          <span>{used}%</span>
        </div>
        <Progress value={Math.min(used, 100)} className="h-2" />
      </div>
      {over && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This trip exceeds the planned budget by {currency(Math.abs(remaining))}. Trim activities or
            raise the budget.
          </span>
        </div>
      )}
    </Card>
  );
}
