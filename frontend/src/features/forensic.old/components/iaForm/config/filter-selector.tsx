import { Filter, CheckCircle2, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type FilterSelectorProps = {
  filters: string[];
  selectedFilters: string[];
  onFilterToggle: (filter: string) => void;
};

export default function FilterSelector({
  filters,
  selectedFilters,
  onFilterToggle,
}: FilterSelectorProps) {
  return (
    <div className="bg-muted/30 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="size-5 text-primary" />
        <h3 className="text-lg font-medium">Filtres Disponibles</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {filters.map((filter) => (
          <div
            key={filter}
            role="button"
            tabIndex={0}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedFilters.includes(filter)
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/20 hover:border-primary/50 bg-white'
            }`}
            onClick={() => onFilterToggle(filter)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onFilterToggle(filter);
              }
            }}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="size-8 rounded-full flex items-center justify-center">
                {selectedFilters.includes(filter) ? (
                  <CheckCircle2 className="size-6 text-primary" />
                ) : (
                  <div className="size-5 rounded border-2 border-muted-foreground/50" />
                )}
              </div>
              <Label className="capitalize cursor-pointer text-sm">
                {filter}
              </Label>
            </div>
          </div>
        ))}
      </div>

      {selectedFilters.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filtres sélectionnés:</span>
            <Badge variant="outline">
              {selectedFilters.length} sur {filters.length}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedFilters.map((filter) => (
              <Badge
                key={filter}
                className="bg-primary/10 text-primary border-primary hover:bg-primary/20 cursor-pointer"
                onClick={() => onFilterToggle(filter)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onFilterToggle(filter);
                  }
                }}
                tabIndex={0}
                role="button"
              >
                {filter} <X className="ml-1 size-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
