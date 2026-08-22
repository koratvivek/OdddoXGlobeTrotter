import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { AppShell } from '@/components/gt/app-shell';
import { EmptyState } from '@/components/gt/cards';
import { Button } from '@/components/ui/button';

export function TripNotFound({ title = 'Trip not found' }) {
  return (
    <AppShell title={title}>
      <EmptyState
        icon={MapPin}
        title="This trip no longer exists"
        description="It may have been deleted. Head back to your trips to pick another."
        action={
          <Button asChild className="rounded-full">
            <Link to="/trips">Back to My Trips</Link>
          </Button>
        }
      />
    </AppShell>
  );
}
