import { useEffect, useState } from 'react';
import { Camera, Edit2, MapPin, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DestinationCard, EmptyState } from '@/components/gt/cards';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { deleteAccount, fetchSavedDestinations, unsaveDestination, updateProfile } from '@/lib/users-api';
import { uploadImage } from '@/lib/uploads-api';
import { fetchAllCities } from '@/lib/trips-api';

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [savedDestinations, setSavedDestinations] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    city: '',
    country: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        city: user.city || '',
        country: user.country || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  // Load cities for the dropdown
  useEffect(() => {
    fetchAllCities().then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    fetchSavedDestinations()
      .then(setSavedDestinations)
      .catch((err) => console.error('Failed to load saved destinations', err));
  }, []);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  const handleUnsave = async (cityId) => {
    try {
      await unsaveDestination(cityId);
      setSavedDestinations((prev) => prev.filter((d) => d.city_id !== cityId));
      toast.success('Removed from saved destinations');
    } catch {
      toast.error('Failed to remove destination');
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { url } = await uploadImage(file);
      setFormData((prev) => ({ ...prev, photo: url }));
      await updateProfile({ photo: url });
      await refreshUser();
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message || 'Failed to upload profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      logout();
      toast.success('Account deleted successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    }
  };

  // When a city is selected from the dropdown, auto-fill country
  const handleCitySelect = (cityName) => {
    const matched = cities.find((c) => c.name === cityName);
    setFormData((prev) => ({
      ...prev,
      city: cityName,
      country: matched?.country || prev.country,
    }));
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header Profile Card */}
      <Card className="overflow-hidden border-border bg-card shadow-card">
        <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5" />
        <CardContent className="relative px-6 pb-6 pt-0 sm:px-8">
          <div className="-mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="relative block cursor-pointer">
                <Avatar className="h-32 w-32 rounded-2xl border-4 border-card shadow-sm">
                  <AvatarImage src={formData.photo || user.photo} alt={user.name} className="object-cover" />
                  <AvatarFallback className="rounded-2xl text-4xl">
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  {uploadingPhoto ? <span className="text-xs">…</span> : <Camera className="h-4 w-4" />}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    void handlePhotoUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
              <div className="mb-2 space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {user.city || user.country ? (
                      <>{[user.city, user.country].filter(Boolean).join(', ')}</>
                    ) : (
                      'Location not set'
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="mb-2 flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Edit2 className="mr-2 h-4 w-4" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {isEditing && (
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              {/* City dropdown — auto-fills country */}
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={formData.city} onValueChange={handleCitySelect}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select a city…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Country — read-only, auto-filled from city selection */}
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  readOnly
                  className="cursor-not-allowed bg-secondary/50 text-muted-foreground"
                  placeholder="Auto-filled from city"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Destinations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Saved Destinations</h2>
        {savedDestinations.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No saved destinations"
            description="Explore the catalog and save places you want to visit."
            action={<Button asChild className="rounded-full"><Link to="/explore">Explore Destinations</Link></Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {savedDestinations.map((dest) => (
              <DestinationCard
                key={dest.city_id}
                city={{
                  id: dest.city_id,
                  name: dest.city_name,
                  country: dest.country,
                  image_url: dest.image_url,
                  cost_index: 3,
                  popularity_score: 5,
                }}
                saved={true}
                onSave={() => handleUnsave(dest.city_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/20 bg-destructive/5 shadow-none">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="font-medium text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is permanent and cannot be undone. All your trips, itineraries,
                  saved destinations, and account data will be removed immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteAccount}
                >
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

