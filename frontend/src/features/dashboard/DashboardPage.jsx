import { AppShell } from '@/components/gt/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <AppShell
      title={`${greeting}, ${user?.first_name ?? 'traveller'} 👋`}
      subtitle="Here's what's next on your travel map."
    >
      <Card className="shadow-card">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Welcome to GlobeTrotter, {user?.first_name}. Your account is set up and ready — trip
            planning features arrive in Phase 2.
          </p>
          {user?.city && user?.country && (
            <p className="mt-2 text-sm">
              Based in {user.city}, {user.country}
            </p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
