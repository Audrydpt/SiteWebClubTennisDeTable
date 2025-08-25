'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Serie } from '@/services/type.ts';

interface SerieSelectorProps {
  series: Serie[];
  selectedSerie: string;
  onSerieChange: (serieId: string) => void;
}

// eslint-disable-next-line import/prefer-default-export
export function SerieSelector({
  series,
  selectedSerie,
  onSerieChange,
}: SerieSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="serie-select" className="text-sm font-medium">
        Série / Division
      </Label>
      <Select value={selectedSerie} onValueChange={onSerieChange}>
        <SelectTrigger id="serie-select" className="bg-white">
          <SelectValue placeholder="Choisir une série..." />
        </SelectTrigger>
        <SelectContent>
          {series.map((serie) => (
            <SelectItem key={serie.id} value={serie.id}>
              <div className="flex flex-col">
                <span className="font-medium">{serie.nom}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
