import { Navigate, createBrowserRouter } from 'react-router-dom';
import { LoginScreen } from '@/components/gt/login-form';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import { BudgetPlaceholderPage } from '@/features/budget/BudgetPlaceholderPage';
import { CatalogPlaceholderPage } from '@/features/catalog/CatalogPlaceholderPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ItineraryPlaceholderPage } from '@/features/itinerary/ItineraryPlaceholderPage';
import { ProfilePlaceholderPage } from '@/features/profile/ProfilePlaceholderPage';
import { TripsPlaceholderPage } from '@/features/trips/TripsPlaceholderPage';
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
  {
    path: '/trips',
    element: (
      <PlaceholderWithShell title="My Trips" subtitle="Your travel plans">
        <TripsPlaceholderPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/trips/new',
    element: (
      <PlaceholderWithShell title="Plan a Trip" subtitle="Create a new itinerary">
        <TripsPlaceholderPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/explore',
    element: (
      <PlaceholderWithShell title="Explore" subtitle="Discover destinations">
        <CatalogPlaceholderPage />
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
    element: (
      <PlaceholderWithShell title="Itinerary Builder" subtitle="Build your trip itinerary">
        <ItineraryPlaceholderPage />
      </PlaceholderWithShell>
    ),
  },
  {
    path: '/budget',
    element: (
      <PlaceholderWithShell title="Budget" subtitle="Trip cost breakdown">
        <BudgetPlaceholderPage />
      </PlaceholderWithShell>
    ),
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
