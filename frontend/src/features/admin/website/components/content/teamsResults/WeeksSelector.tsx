'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface WeekSelectorProps {
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  disabled?: boolean;
  maxWeeks?: number;
}

// eslint-disable-next-line import/prefer-default-export
export function WeekSelector({
  selectedWeek,
  onWeekChange,
  disabled,
  maxWeeks = 22,
}: WeekSelectorProps) {
  const semaines = Array.from({ length: maxWeeks }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      <Label htmlFor="week-select" className="text-sm font-medium">
        Semaine
      </Label>
      <Select
        value={selectedWeek.toString()}
        onValueChange={(v) => onWeekChange(Number.parseInt(v, 10))}
        disabled={disabled}
      >
        <SelectTrigger id="week-select" className="bg-white">
          <SelectValue placeholder="Choisir une semaine..." />
        </SelectTrigger>
        <SelectContent>
          {semaines.map((semaine) => (
            <SelectItem key={semaine} value={semaine.toString()}>
              Semaine {semaine}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
