import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Copy, Heart, MapPin, Sparkles, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/gt/app-shell';
import { EmptyState } from '@/components/gt/cards';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAuthToken } from '@/lib/apiClient';
import {
  copySharedTrip,
  findShareBySlug,
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

export function CommunityDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const match = await findShareBySlug(slug);
      if (!match) {
        setNotFound(true);
        setPost(null);
      } else {
        setPost(match);
        setNotFound(false);
      }
    } catch (err) {
      if (String(err.message).toLowerCase().includes('authenticated')) {
        navigate('/login');
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLike = async () => {
    if (!post || !authOrLogin(navigate)) return;
    try {
      const result = post.likedByMe ? await unlikeShare(post.id) : await likeShare(post.id);
      setPost({ ...post, likeCount: result.like_count, likedByMe: result.liked_by_me });
    } catch (err) {
      if (String(err.message).toLowerCase().includes('authenticated')) {
        navigate('/login');
      } else {
        toast.error(err.message || 'Failed to update like');
      }
    }
  };

  const handleCopy = async () => {
    if (!post || !authOrLogin(navigate)) return;
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

  if (loading) {
    return (
      <AppShell title="Community">
        <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
      </AppShell>
    );
  }

  if (notFound || !post) {
    return (
      <AppShell title="Community">
        <EmptyState
          icon={Sparkles}
          title="Itinerary not found"
          description="This shared trip may have been removed by its author."
          action={
            <Button asChild className="rounded-full">
              <Link to="/community">Back to community</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const perDay = Math.round(post.budget / Math.max(post.days, 1));

  return (
    <AppShell title={post.tripName} subtitle={`Shared by ${post.authorName}`}>
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link to="/community">
            <ArrowLeft className="mr-1 h-4 w-4" />
            All itineraries
          </Link>
        </Button>

        <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-card">
          <img src={post.coverImage} alt={post.tripName} className="h-64 w-full object-cover" />
          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">{post.tripName}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {post.destination}
                </p>
              </div>
              <div className="flex gap-2">
                <Button className="rounded-full" onClick={handleCopy}>
                  <Copy className="mr-1 h-4 w-4" />
                  Copy to my trips
                </Button>
                <Button variant="outline" className="rounded-full" onClick={toggleLike}>
                  <Heart
                    className={`mr-1 h-4 w-4 ${post.likedByMe ? 'fill-accent text-accent' : 'text-accent'}`}
                  />
                  {post.likeCount}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {post.authorInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{post.authorName}</p>
                <p className="text-xs text-muted-foreground">Published {formatDate(post.createdAt)}</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{post.description}</p>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="rounded-xl border-border p-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Duration
                </p>
                <p className="mt-1 text-xl font-bold">{post.days} days</p>
              </Card>
              <Card className="rounded-xl border-border p-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  Total budget
                </p>
                <p className="mt-1 text-xl font-bold">{currency(post.budget)}</p>
              </Card>
              <Card className="rounded-xl border-border p-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  Per day
                </p>
                <p className="mt-1 text-xl font-bold">{currency(perDay)}</p>
              </Card>
            </div>

            <div>
              <h2 className="text-base font-bold">Trip highlights</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {post.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-sm">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{post.days}-day plan</Badge>
              <Badge variant="secondary">{post.destination}</Badge>
              <Badge variant="secondary">{post.likeCount} likes</Badge>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
