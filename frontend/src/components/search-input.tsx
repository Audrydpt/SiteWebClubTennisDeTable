import { X } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = 'w-full',
}: SearchInputProps) {
  return (
    <div className="relative flex-1">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
      {value && (
        <X
          className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => onChange('')}
          aria-label="Clear search"
        />
      )}
    </div>
  );
}
