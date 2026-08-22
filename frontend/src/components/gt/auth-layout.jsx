import { Globe2 } from 'lucide-react';
import hero from '@/assets/hero.jpg';

export function AuthLayout({ title, subtitle, children, wide }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_minmax(0,1.05fr)]">
      <div className="relative hidden lg:block">
        <img
          src={hero}
          alt="Turquoise coastline seen from above"
          width={1200}
          height={1500}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/25" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-primary-foreground">
          <p className="text-3xl font-extrabold leading-tight">
            Plan multi-city trips
            <br />
            you&apos;ll actually take.
          </p>
          <p className="mt-3 max-w-sm text-sm opacity-90">
            Itineraries, budgets, activities and shareable plans — all in one place.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Globe2 className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">GlobeTrotter</span>
          </div>
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
