import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { router } from '@/routes';
import { StoreProvider } from '@/lib/store';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <Toaster position="top-right" richColors />
          <RouterProvider router={router} />
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
