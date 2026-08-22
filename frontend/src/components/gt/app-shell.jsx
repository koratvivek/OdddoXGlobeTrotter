import { useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CalendarDays,
  Compass,
  Globe2,
  Home,
  LogOut,
  Map,
  Plus,
  Search,
  Settings,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/trips', label: 'My Trips', icon: Map },
  { to: '/trips/new', label: 'Plan a Trip', icon: Plus },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

const mobileNav = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/trips', label: 'Trips', icon: Map },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export function Logo({ className }) {
  return (
    <Link to="/dashboard" className={cn('flex items-center gap-2', className)}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Globe2 className="h-5 w-5" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">GlobeTrotter</span>
    </Link>
  );
}

function NavLinks({ onNavigate, isAdmin }) {
  const items = isAdmin
    ? [...nav, { to: '/admin', label: 'Admin Dashboard', icon: BarChart3 }]
    : nav;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-secondary hover:text-foreground',
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground',
            )
          }
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell({ children, title, subtitle, actions }) {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (ready && !user) navigate('/login', { replace: true });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading GlobeTrotter…
      </div>
    );
  }

  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
  const isAdmin = user.is_admin;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-5 lg:flex">
        <Logo />
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavLinks isAdmin={isAdmin} />
        </div>
        <div className="rounded-2xl bg-primary/8 p-4">
          <p className="text-sm font-semibold">Ready for the next one?</p>
          <p className="mt-1 text-xs text-muted-foreground">Build a multi-city itinerary in minutes.</p>
          <Button asChild size="sm" className="mt-3 w-full rounded-full">
            <Link to="/trips/new">Plan a Trip</Link>
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                    <Globe2 className="h-5 w-5 text-primary" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <Logo />
                  <div className="mt-8">
                    <NavLinks isAdmin={isAdmin} />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold sm:text-xl">{title ?? 'GlobeTrotter'}</h1>
                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {actions}
              <Button variant="ghost" size="icon" asChild aria-label="Search">
                <Link to="/explore">
                  <Search className="h-[18px] w-[18px]" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative hidden sm:inline-flex"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full outline-none ring-ring focus-visible:ring-2"
                    aria-label="Account"
                  >
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <span className="block truncate">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate('/login', { replace: true });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
