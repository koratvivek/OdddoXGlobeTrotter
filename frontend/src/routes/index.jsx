import { Navigate, createBrowserRouter } from 'react-router-dom';
import { LoginScreen } from '@/components/gt/login-form';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import { TripBudgetPage } from '@/features/budget/TripBudgetPage';
import { CatalogPage } from '@/features/catalog/CatalogPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProfilePlaceholderPage } from '@/features/profile/ProfilePlaceholderPage';
import { CreateTripPage } from '@/features/trips/CreateTripPage';
import { EditTripPage } from '@/features/trips/EditTripPage';
import { TripItineraryPage } from '@/features/trips/TripItineraryPage';
import { TripOverviewPage } from '@/features/trips/TripOverviewPage';
import { TripsListPage } from '@/features/trips/TripsListPage';
import { CalendarPage } from '@/features/visualization/CalendarPage';
import { CommunityDetailPage } from '@/features/visualization/CommunityDetailPage';
import { CommunityPage } from '@/features/visualization/CommunityPage';
import { SharePage } from '@/features/visualization/SharePage';
import { AppShell } from '@/components/gt/app-shell';

function PlaceholderWithShell({ title, subtitle, children }) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      {children}
    </AppShell>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginScreen /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/trips', element: <TripsListPage /> },
  { path: '/trips/new', element: <CreateTripPage /> },
  { path: '/trips/:id', element: <TripOverviewPage /> },
  { path: '/trips/:id/edit', element: <EditTripPage /> },
  { path: '/trips/:id/itinerary', element: <TripItineraryPage /> },
  { path: '/share/:slug', element: <SharePage /> },
  {
    path: '/calendar',
    element: <CalendarPage />,
  },
  {
    path: '/community',
    element: <CommunityPage />,
  },
  {
    path: '/community/:slug',
    element: <CommunityDetailPage />,
  },
  {
    path: '/explore',
    element: (
      <PlaceholderWithShell title="Explore" subtitle="Discover destinations">
        <CatalogPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/profile',
    element: (
      <PlaceholderWithShell title="Profile" subtitle="Your account">
        <ProfilePlaceholderPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/settings',
    element: (
      <PlaceholderWithShell title="Settings" subtitle="Preferences">
        <ProfilePlaceholderPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/admin',
    element: (
      <PlaceholderWithShell title="Admin Dashboard" subtitle="Platform analytics">
        <ProfilePlaceholderPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/itinerary',
    element: <Navigate to="/trips" replace />,
  },
  {
    path: '/trips/:id/budget',
    element: (
      <PlaceholderWithShell title="Trip Budget" subtitle="Trip cost breakdown">
        <TripBudgetPage />
      </PlaceholderWithShell>
    ),
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
