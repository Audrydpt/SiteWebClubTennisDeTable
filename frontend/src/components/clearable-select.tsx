import { X } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ClearableSelectProps extends React.ComponentProps<typeof Select> {
  onValueChange: (value: string | null) => void;
  className?: string;
}

export default function ClearableSelect({
  onValueChange,
  children,
  className,
  ...props
}: ClearableSelectProps) {
  const [value, setValue] = React.useState<string | null>();

  const handleSelect = (newValue: string) => {
    setValue(newValue);
    onValueChange(newValue);
  };

  const handleClear = () => {
    setValue(null);
    onValueChange(null);
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Select value={value ?? ''} onValueChange={handleSelect} {...props}>
        {children}
      </Select>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
