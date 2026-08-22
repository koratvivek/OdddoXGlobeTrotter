import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Copy, Heart, MapPin, Search, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { EmptyState } from '@/components/gt/cards';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { getAuthToken } from '@/lib/apiClient';
import {
  copySharedTrip,
  fetchShares,
  likeShare,
  unlikeShare,
} from '@/lib/shares-api';
import { currency, formatDate } from '@/lib/trip-utils';

function authOrLogin(navigate) {
  if (!getAuthToken()) {
    navigate('/login');
    return false;
  }
  return true;
}

export function CommunityPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total_pages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedQuery((current) => (current === query ? current : query));
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchShares({
        page,
        pageSize: 20,
        q: appliedQuery || undefined,
        sort,
      });
      setData(result);
    } catch (err) {
      if (String(err.message).toLowerCase().includes('authenticated')) {
        navigate('/login');
      } else {
        toast.error(err.message || 'Failed to load community');
        setData({ items: [], total_pages: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, page, appliedQuery, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [sort]);

  const pages = useMemo(() => {
    const total = data.total_pages || 0;
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [data.total_pages]);

  const toggleLike = async (post) => {
    if (!authOrLogin(navigate)) return;
    try {
      const result = post.likedByMe
        ? await unlikeShare(post.id)
        : await likeShare(post.id);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === post.id
            ? { ...item, likeCount: result.like_count, likedByMe: result.liked_by_me }
            : item,
        ),
      }));
    } catch (err) {
      if (String(err.message).toLowerCase().includes('authenticated')) {
        navigate('/login');
      } else {
        toast.error(err.message || 'Failed to update like');
      }
    }
  };

  const handleCopy = async (post) => {
    if (!authOrLogin(navigate)) return;
    try {
      const copied = await copySharedTrip(post.slug);
      toast.success('Itinerary copied to your trips');
      navigate(`/trips/${copied.trip_id}`);
    } catch (err) {
      if (String(err.message).toLowerCase().includes('authenticated')) {
        navigate('/login');
      } else {
        toast.error(err.message || 'Failed to copy trip');
      }
    }
  };

  return (
    <AppShell title="Community" subtitle="Itineraries shared by fellow travellers">
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trips, destinations or travellers"
              aria-label="Search community itineraries"
              className="h-11 rounded-xl pl-9"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-11 rounded-xl" aria-label="Sort posts">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most liked</SelectItem>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="budget">Lowest budget</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No itineraries found"
            description="Try another destination or clear the search to see everything the community has shared."
            action={
              <Button className="rounded-full" onClick={() => setQuery('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {data.items.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden rounded-2xl border-border p-0 shadow-card transition-shadow hover:shadow-lg"
              >
                <Link to={`/community/${post.slug}`} className="block">
                  <img
                    src={post.coverImage}
                    alt={post.tripName}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                </Link>
                <div className="space-y-3 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {post.authorInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{post.authorName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Shared {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Link to={`/community/${post.slug}`} className="text-lg font-bold hover:underline">
                      {post.tripName}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{post.destination}</span>
                    </p>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.highlights.slice(0, 3).map((h) => (
                      <Badge key={h} variant="secondary">
                        {h}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {post.days} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" />
                      {currency(post.budget)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button size="sm" className="rounded-full" onClick={() => handleCopy(post)}>
                      <Copy className="mr-1 h-4 w-4" />
                      Copy trip
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link to={`/community/${post.slug}`}>View details</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto rounded-full"
                      onClick={() => toggleLike(post)}
                      aria-label={`Like ${post.tripName}`}
                    >
                      <Heart
                        className={`mr-1 h-4 w-4 ${post.likedByMe ? 'fill-accent text-accent' : 'text-accent'}`}
                      />
                      {post.likeCount}
                    </Button>
                  </div>
                </div>
              </Card>
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
