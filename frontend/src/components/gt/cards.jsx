import { Clock, Heart, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function currency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DestinationCard({
  city,
  saved,
  onSave,
  onAdd,
  className,
}) {
  return (
    <Card className={cn("group overflow-hidden rounded-2xl border-border p-0 shadow-card", className)}>
      <div className="relative h-36 overflow-hidden">
        <img
          src={city.image_url || city.image}
          alt={`${city.name}, ${city.country}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {onSave && (
          <button
            onClick={onSave}
            aria-label={saved ? "Remove from saved" : "Save destination"}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/85 backdrop-blur transition-colors hover:bg-background"
          >
            <Heart className={cn("h-4 w-4", saved ? "fill-accent text-accent" : "text-foreground")} />
          </button>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold">{city.name}</h3>
            <p className="truncate text-xs text-muted-foreground">{city.country} {city.region ? `· ${city.region}` : ''}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {city.popularity_score || city.popularity}
          </Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{city.description}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-medium text-muted-foreground">
            Cost index {"$".repeat(city.cost_index || city.costIndex)}
            <span className="text-border">{"$".repeat(5 - (city.cost_index || city.costIndex))}</span>
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

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
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
