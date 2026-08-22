import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import { BudgetPlaceholderPage } from '@/features/budget/BudgetPlaceholderPage';
import { CatalogPlaceholderPage } from '@/features/catalog/CatalogPlaceholderPage';
import { ItineraryPlaceholderPage } from '@/features/itinerary/ItineraryPlaceholderPage';
import { ProfilePlaceholderPage } from '@/features/profile/ProfilePlaceholderPage';
import { TripsPlaceholderPage } from '@/features/trips/TripsPlaceholderPage';
import { VisualizationPlaceholderPage } from '@/features/visualization/VisualizationPlaceholderPage';

function HomePage() {
  return (
    <div className="card">
      <h1>Plan your next adventure</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
        GlobeTrotter helps you build collaborative multi-city itineraries with budgets and
        timelines.
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'trips', element: <TripsPlaceholderPage /> },
      { path: 'catalog', element: <CatalogPlaceholderPage /> },
      { path: 'itinerary', element: <ItineraryPlaceholderPage /> },
      { path: 'budget', element: <BudgetPlaceholderPage /> },
      { path: 'visualization', element: <VisualizationPlaceholderPage /> },
      { path: 'profile', element: <ProfilePlaceholderPage /> },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
