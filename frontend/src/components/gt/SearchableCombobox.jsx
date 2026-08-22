import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';

/**
 * Reusable searchable combobox dropdown.
 *
 * Props:
 *  - id          : string  — for Label htmlFor
 *  - label       : string  — field label text
 *  - value       : string  — current selected value
 *  - onChange    : (val: string) => void
 *  - options     : Array<{ value: string; label: string; sublabel?: string }>
 *  - isLoading   : bool    — show skeleton rows instead of list
 *  - disabled    : bool    — grey out & prevent open
 *  - error       : string  — validation error message
 */
export function SearchableCombobox({
  id,
  label,
  value,
  onChange,
  options = [],
  isLoading = false,
  disabled = false,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <div className="space-y-2" ref={ref}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        {/* Trigger */}
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setOpen((o) => !o);
              setSearch('');
            }
          }}
          className={`flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-secondary/30'
          }`}
        >
          <span className={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedLabel || '\u00a0'}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
            {/* Search row */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* List */}
            <ul className="max-h-52 overflow-y-auto py-1" role="listbox">
              {isLoading ? (
                // Skeleton rows
                [1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="px-3 py-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-secondary/60" />
                  </li>
                ))
              ) : filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No results.</li>
              ) : (
                filtered.map((o) => (
                  <li
                    key={o.value}
                    role="option"
                    aria-selected={value === o.value}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-secondary ${
                      value === o.value ? 'bg-primary/10 font-medium text-primary' : ''
                    }`}
                  >
                    {o.label}
                    {o.sublabel && (
                      <span className="ml-1.5 text-xs text-muted-foreground">{o.sublabel}</span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
