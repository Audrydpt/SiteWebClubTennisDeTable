import { Check, Palette } from 'lucide-react';
import { useController, Control, Path } from 'react-hook-form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Color } from '../../lib/types';
import { ForensicFormValues } from '../../lib/provider/forensic-form-context';

interface ColorPickerProps {
  colors: Color[];
  name: Path<ForensicFormValues>;
  control: Control<ForensicFormValues>;
  className?: string;
  useColorNames?: boolean;
}

export default function ColorPicker({
  colors,
  name,
  control,
  className,
  useColorNames = false,
}: ColorPickerProps) {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    defaultValue: [],
  });

  const selected = Array.isArray(value) ? value : [];

  // Find a color object by its value (hex) or name
  const findColorByValueOrName = (colorValue: string) =>
    colors.find(
      (c) => c.value === colorValue || c.name.toLowerCase() === colorValue
    );

  // Get the corresponding hex value for display purposes
  const getDisplayColor = (colorValue: string) => {
    const color = findColorByValueOrName(colorValue);
    return color ? color.value : colorValue;
  };

  const handleColorToggle = (color: Color) => {
    const colorValue = useColorNames ? color.name.toLowerCase() : color.value;

    if (selected.includes(colorValue)) {
      onChange(selected.filter((c: string) => c !== colorValue));
    } else {
      onChange([...selected, colorValue]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-auto p-2 gap-1 flex-wrap', className)}
        >
          {selected.length === 0 ? (
            <Palette />
          ) : (
            selected.map((colorValue: string) => (
              <div
                key={colorValue}
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: getDisplayColor(colorValue) }}
                title={colorValue}
              />
            ))
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => {
            const colorValue = useColorNames
              ? color.name.toLowerCase()
              : color.value;
            const isSelected = selected.includes(colorValue);

            return (
              <button
                key={color.value}
                className="w-12 h-12 rounded-lg border relative hover:scale-105 transition-transform"
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorToggle(color)}
                title={color.name}
                type="button"
              >
                {isSelected && (
                  <Check
                    className={cn(
                      'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                      color.value === '#FFFFFF' ? 'text-black' : 'text-white'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
