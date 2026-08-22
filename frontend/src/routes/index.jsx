import { Navigate, createBrowserRouter } from 'react-router-dom';
import { LoginScreen } from '@/components/gt/login-form';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import { TripBudgetPage } from '@/features/budget/TripBudgetPage';
import { CatalogPage } from '@/features/catalog/CatalogPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { SettingsPage } from '@/features/profile/SettingsPage';
import { CreateTripPage } from '@/features/trips/CreateTripPage';
import { EditTripPage } from '@/features/trips/EditTripPage';
import { TripItineraryPage } from '@/features/trips/TripItineraryPage';
import { TripOverviewPage } from '@/features/trips/TripOverviewPage';
import { TripsListPage } from '@/features/trips/TripsListPage';
import { VisualizationPlaceholderPage } from '@/features/visualization/VisualizationPlaceholderPage';
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

  {
    path: '/explore',
    element: (
      <PlaceholderWithShell title="Explore" subtitle="Discover destinations">
        <CatalogPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/calendar',
    element: (
      <PlaceholderWithShell title="Calendar" subtitle="Your trip timeline">
        <VisualizationPlaceholderPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/community',
    element: (
      <PlaceholderWithShell title="Community" subtitle="Shared itineraries">
        <VisualizationPlaceholderPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/profile',
    element: (
      <PlaceholderWithShell title="Profile" subtitle="Your account">
        <ProfilePage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/settings',
    element: (
      <PlaceholderWithShell title="Settings" subtitle="Preferences">
        <SettingsPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/admin',
    element: (
      <PlaceholderWithShell title="Admin Dashboard" subtitle="Platform analytics">
        <AdminDashboardPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/itinerary',
    element: <Navigate to="/trips" replace />,
  },
  {
    path: '/trips/:id/budget',
    element: <TripBudgetPage />,
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
