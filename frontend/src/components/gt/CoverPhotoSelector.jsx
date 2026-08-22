import { useState, useEffect } from 'react';
import { Check, ImagePlus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function CoverPhotoSelector({
  cities,
  cover,
  selectedCoverId,
  onSelectCover,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [presets, setPresets] = useState([]);

  // Pick 3 stable random presets on mount, ensuring currently selected preset (if any) is included
  useEffect(() => {
    if (cities && cities.length > 0) {
      const currentSelected = cities.find((c) => c.image === cover && c.id === selectedCoverId);
      const remaining = cities.filter((c) => c.id !== selectedCoverId);
      
      // Shuffle remaining cities randomly
      const shuffled = [...remaining].sort(() => 0.5 - Math.random());
      const selectedCount = currentSelected ? 2 : 3;
      const chosen = shuffled.slice(0, selectedCount);
      
      if (currentSelected) {
        setPresets([currentSelected, ...chosen]);
      } else {
        setPresets(chosen);
      }
    }
  }, [cities, cover, selectedCoverId]);

  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 5-Column Grid: 3 presets, 1 custom upload, 1 view more */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {presets.map((c) => {
          const isSelected = cover === c.image && selectedCoverId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCover(c.image, c.id)}
              className={cn(
                'relative h-24 overflow-hidden rounded-xl border-2 transition-all cursor-pointer hover:shadow-sm',
                isSelected ? 'border-primary' : 'border-transparent hover:border-border bg-secondary/20',
              )}
              aria-label={`Use ${c.name} as cover photo`}
              aria-pressed={isSelected}
            >
              <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-foreground/60 px-2 py-1 text-left text-[10px] font-medium text-background truncate">
                {c.name}
              </span>
              {isSelected && (
                <span className="absolute right-1.5 top-1.5 grid h-5.5 w-5.5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}

        {/* Custom Upload Button */}
        <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-all hover:bg-secondary/40 bg-background/50">
          <ImagePlus className="h-4 w-4 mb-1 text-muted-foreground" />
          <span className="text-[10px] font-medium">Upload custom</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                onSelectCover(URL.createObjectURL(f), 'custom');
              }
            }}
          />
        </label>

        {/* View More Dialog */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-all hover:bg-secondary/40 bg-background/50"
            >
              <Search className="h-4 w-4 mb-1 text-muted-foreground" />
              <span className="text-[10px] font-medium">View more</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Select cover photo</DialogTitle>
            </DialogHeader>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cover photo cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-lg bg-background"
              />
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto pr-1 flex-1 max-h-[400px]">
              {filtered.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl bg-secondary/5">
                  <p className="text-sm text-muted-foreground">No matching cover photos found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 p-0.5">
                  {filtered.map((c) => {
                    const isSelected = cover === c.image && selectedCoverId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectCover(c.image, c.id);
                          setModalOpen(false);
                        }}
                        className={cn(
                          'relative h-24 overflow-hidden rounded-xl border-2 transition-all cursor-pointer hover:shadow-sm',
                          isSelected ? 'border-primary' : 'border-transparent hover:border-border bg-secondary/20',
                        )}
                        aria-label={`Use ${c.name} as cover photo`}
                        aria-pressed={isSelected}
                      >
                        <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-foreground/60 px-2 py-1 text-left text-[10px] font-medium text-background truncate">
                          {c.name}
                        </span>
                        {isSelected && (
                          <span className="absolute right-1.5 top-1.5 grid h-5.5 w-5.5 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
