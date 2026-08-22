import { useEffect, useState } from 'react';
import { Activity, Map, Search, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StatCard } from '@/components/gt/cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { fetchAdminOverview, fetchAdminPopularActivities, fetchAdminPopularCities, fetchAdminTripStats, fetchAdminUsers } from '@/lib/admin-api';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [tripStats, setTripStats] = useState(null);
  const [popularCities, setPopularCities] = useState([]);
  const [popularActivities, setPopularActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !user.is_admin) {
      toast.error('You do not have permission to view the admin dashboard');
      navigate('/dashboard');
      return;
    }

    const loadData = async () => {
      try {
        const [ov, ts, pc, pa, usrs] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminTripStats(),
          fetchAdminPopularCities(),
          fetchAdminPopularActivities(),
          fetchAdminUsers({ page: 1, pageSize: 10 }),
        ]);
        setOverview(ov);
        setTripStats(ts);
        setPopularCities(pc);
        setPopularActivities(pa);
        setUsers(usrs.items);
      } catch (err) {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    if (user?.is_admin) {
      loadData();
    }
  }, [user, navigate]);

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    try {
      const data = await fetchAdminUsers({ page: 1, pageSize: 10, q: searchQuery });
      setUsers(data.items);
    } catch (err) {
      toast.error('Failed to search users');
    }
  };

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={overview.total_users} icon={Users} trend="+12% this month" trendUp={true} />
        <StatCard label="Total Trips" value={overview.total_trips} icon={Map} trend="+8% this month" trendUp={true} />
        <StatCard label="Destinations" value={overview.total_cities} icon={Map} />
        <StatCard label="Activities" value={overview.total_activities} icon={Activity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Cities */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Popular Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Stops</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularCities.map((city) => (
                  <TableRow key={city.city_id}>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell>{city.country}</TableCell>
                    <TableCell className="text-right">{city.stop_count}</TableCell>
                  </TableRow>
                ))}
                {popularCities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Popular Activities */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Popular Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularActivities.map((act) => (
                  <TableRow key={act.activity_id}>
                    <TableCell className="font-medium">{act.name}</TableCell>
                    <TableCell>{act.city_name}</TableCell>
                    <TableCell className="text-right">{act.usage_count}</TableCell>
                  </TableRow>
                ))}
                {popularActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Users Management */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>User Management</CardTitle>
          <form onSubmit={handleSearchUsers} className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Trips</TableHead>
                <TableHead className="text-right">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {u.name}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{u.trip_count}</TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${u.is_admin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
