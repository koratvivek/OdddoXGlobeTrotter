import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  
  Home,Compass,
  LogOut,
  Map,
  Menu,
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

export function Logo({ className, hideText }) {
  return (
    <Link
      to="/dashboard"
      className={cn(
        'group relative flex items-center gap-2 px-3 transition-all duration-300',
        hideText && 'justify-center px-0 w-full',
        className,
      )}
    >
      <img src="/logo.svg" alt="GlobeTrotter Logo" className="h-9 w-9 shrink-0" />
      {!hideText && <span className="text-lg font-extrabold tracking-tight">GlobeTrotter</span>}
      {hideText && (
        <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-50 opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap">
          GlobeTrotter
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
        </span>
      )}
    </Link>
  );
}

function NavLinks({ onNavigate, isAdmin, hideLabels }) {
  const items = isAdmin
    ? [...nav, { to: '/admin', label: 'Admin Dashboard', icon: BarChart3 }]
    : nav;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/trips'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-secondary hover:text-foreground',
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground',
              hideLabels && 'justify-center px-0',
            )
          }
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {!hideLabels && <span className="truncate">{item.label}</span>}

          {/* Custom CSS Tooltip */}
          {hideLabels && (
            <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-50 opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap">
              {item.label}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell({ children, title, subtitle, actions }) {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    return localStorage.getItem('gt_sidebar_collapsed') === 'true';
  });

  const toggleDesktopSidebar = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('gt_sidebar_collapsed', String(next));
      return next;
    });
  };

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
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-sidebar px-4 py-5 lg:flex transition-all duration-300 ease-in-out',
          isDesktopCollapsed ? 'w-20 px-3' : 'w-64',
        )}
      >
        <Logo hideText={isDesktopCollapsed} />

        <Button
          variant="outline"
          size="icon"
          onClick={toggleDesktopSidebar}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-40 hidden h-7 w-7 rounded-full border border-border bg-background shadow-sm hover:bg-accent lg:flex items-center justify-center"
          aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isDesktopCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </Button>

        <div className={cn('mt-8 flex-1', isDesktopCollapsed ? 'overflow-visible' : 'overflow-y-auto')}>
          <NavLinks hideLabels={isDesktopCollapsed} isAdmin={isAdmin} />
        </div>
        {!isDesktopCollapsed && (
          <div className="rounded-2xl bg-primary/8 p-4">
            <p className="text-sm font-semibold">Ready for the next one?</p>
            <p className="mt-1 text-xs text-muted-foreground">Build a multi-city itinerary in minutes.</p>
            <Button asChild size="sm" className="mt-3 w-full rounded-full">
              <Link to="/trips/new">Plan a Trip</Link>
            </Button>
          </div>
        )}
      </aside>

      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isDesktopCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
                onClick={() => setIsMobileExpanded(true)}
              >
                <Menu className="h-5 w-5 text-primary" />
              </Button>
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
              {/* <Button
                variant="ghost"
                size="icon"
                className="relative hidden sm:inline-flex"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
              </Button> */}
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

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
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

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileExpanded && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsMobileExpanded(false)}
        />
      )}

      {/* Mobile Collapsible Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-sidebar px-4 py-5 transition-transform duration-300 ease-in-out lg:hidden',
          isMobileExpanded ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileExpanded(false)}
            aria-label="Collapse menu"
          >
            <ChevronLeft className="h-5 w-5 text-primary" />
          </Button>
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavLinks onNavigate={() => setIsMobileExpanded(false)} isAdmin={isAdmin} />
        </div>
      </aside>
    </div>
  );
}
