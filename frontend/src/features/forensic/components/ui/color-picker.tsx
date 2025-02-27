/* eslint-disable */
import { Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Color } from '../../lib/types';

interface ColorPickerProps {
  colors: Color[];
  selected: string[];
  onChange: (colors: string[]) => void;
  className?: string;
}

export default function ColorPicker({
  colors,
  selected,
  onChange,
  className,
}: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-auto p-2 gap-1 flex-wrap', className)}
        >
          {selected.length === 0 ? (
            <div className="h-6 flex items-center text-muted-foreground">
              Sélectionner des couleurs
            </div>
          ) : (
            selected.map((color) => (
              <div
                key={color}
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: color }}
              />
            ))
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              className="w-12 h-12 rounded-lg border relative hover:scale-105 transition-transform"
              style={{ backgroundColor: color.value }}
              onClick={() => {
                if (selected.includes(color.value)) {
                  onChange(selected.filter((c) => c !== color.value));
                } else {
                  onChange([...selected, color.value]);
                }
              }}
              title={color.name}
            >
              {selected.includes(color.value) && (
                <Check
                  className={cn(
                    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                    color.value === '#FFFFFF' ? 'text-black' : 'text-white'
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
