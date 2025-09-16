import { X } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Option = { value: string; label: string };

type MultiSelectProps = {
  options: Array<string | Option>;
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxSelected?: number;
  // Nouveaux libellés optionnels (fallback FR si non fournis)
  labels?: {
    search?: string;
    all?: string;
    clear?: string;
    noResults?: string;
  };
};

export default function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder,
  maxSelected,
  labels,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const l = {
    search: labels?.search || 'Rechercher...',
    all: labels?.all || 'Tout',
    clear: labels?.clear || 'Effacer',
    noResults: labels?.noResults || 'Aucun résultat',
  };

  const opts: Option[] = React.useMemo(
    () =>
      options.map((o) =>
        typeof o === 'string'
          ? { value: o, label: o }
          : { value: o.value, label: o.label }
      ),
    [options]
  );

  const selectedLabels = React.useMemo(() => {
    const map = new Map(opts.map((o) => [o.value, o.label] as const));
    return selected.map((v) => map.get(v) || v);
  }, [opts, selected]);

  const handleSelect = (value: string) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onChange(selected.filter((i) => i !== value));
      return;
    }
    if (typeof maxSelected === 'number' && selected.length >= maxSelected) {
      // Ne pas dépasser la limite
      return;
    }
    onChange([...selected, value]);
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
  };

  const handleSelectAllToggle = () => {
    if (selected.length === opts.length) {
      onChange([]);
    } else {
      const next =
        typeof maxSelected === 'number'
          ? opts.slice(0, maxSelected).map((o) => o.value)
          : opts.map((o) => o.value);
      onChange(next);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between border-input"
        >
          <span className="truncate max-w-[85%] inline-block">
            {selected.length > 0
              ? selectedLabels.join(' | ')
              : placeholder || l.search}
          </span>
          {selected.length > 0 && (
            <X
              className="size-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClearAll}
              role="button"
              aria-label="Clear selection"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <div className="flex items-center justify-between p-2">
            <CommandInput placeholder={placeholder || l.search} />
            <Button variant="ghost" onClick={handleSelectAllToggle}>
              {selected.length === opts.length ? l.clear : l.all}
            </Button>
          </div>
          <CommandList>
            <CommandEmpty>{l.noResults}</CommandEmpty>
            <CommandGroup>
              {Array.isArray(opts) &&
                opts.map((item) => (
                  <CommandItem
                    key={item.value}
                    onSelect={() => handleSelect(item.value)}
                  >
                    {item.label}
                    {selected.includes(item.value) && (
                      <X className="ml-auto size-4" />
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
