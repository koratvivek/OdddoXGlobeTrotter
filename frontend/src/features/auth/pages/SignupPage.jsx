import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/gt/auth-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/lib/users-api';
import { uploadImage } from '@/lib/uploads-api';

const strengthOf = (p) => {
  let s = 0;
  if (p.length >= 8) s += 34;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s += 33;
  if (/\d|[^\w\s]/.test(p)) s += 33;
  return s;
};

export function SignupPage() {
  const { signup, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    bio: '',
  });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const strength = strengthOf(password);
  const strengthLabel = strength < 40 ? 'Weak' : strength < 80 ? 'Good' : 'Strong';

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (password.length < 8) next.password = 'Use at least 8 characters';
    if (password !== confirm) next.confirm = 'Passwords do not match';
    if (!agree) next.agree = 'Please accept the terms to continue';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await signup({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password,
        phone: form.phone || null,
        city: form.city || null,
        country: form.country || null,
        bio: form.bio || null,
      });
      if (photoFile) {
        const { url } = await uploadImage(photoFile);
        await updateProfile({ photo: url });
        await refreshUser();
      }
      toast.success('Account created — welcome aboard!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const field = (id, label, type = 'text', placeholder = '') => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={form[id]}
        onChange={set(id)}
        placeholder={placeholder}
        className="h-11 rounded-xl"
      />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <AuthLayout wide title="Create your account" subtitle="A few details and your first itinerary is minutes away.">
      <form onSubmit={submit} className="space-y-6" noValidate>
        <div className="flex items-center gap-4">
          <label className="relative grid h-20 w-20 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-border bg-secondary text-muted-foreground">
            {photo ? (
              <img src={photo} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPhotoFile(file);
                  setPhoto(URL.createObjectURL(file));
                }
              }}
            />
          </label>
          <div>
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-xs text-muted-foreground">PNG or JPG, up to 5MB. Optional.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field('firstName', 'First name', 'text', 'Alex')}
          {field('lastName', 'Last name', 'text', 'Rivera')}
          {field('email', 'Email address', 'email', 'you@example.com')}
          {field('phone', 'Phone number', 'tel', '+1 415 555 0132')}
          {field('city', 'City', 'text', 'San Francisco')}
          {field('country', 'Country', 'text', 'USA')}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
            <div className="relative">
              <Input
                id="pw"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="space-y-1">
                <Progress value={strength} className="h-1.5" />
                <p className="text-xs text-muted-foreground">Password strength: {strengthLabel}</p>
              </div>
            )}
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpw">Confirm password</Label>
            <Input
              id="cpw"
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11 rounded-xl"
            />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">About you</Label>
          <Textarea
            id="bio"
            value={form.bio}
            onChange={set('bio')}
            rows={3}
            placeholder="Tell fellow travellers what kind of trips you love planning…"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} className="mt-0.5" />
            <span>I agree to the GlobeTrotter Terms of Service and Privacy Policy.</span>
          </label>
          {errors.agree && <p className="text-xs text-destructive">{errors.agree}</p>}
        </div>

        <Button type="submit" disabled={loading} className="h-11 w-full rounded-full text-base">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
