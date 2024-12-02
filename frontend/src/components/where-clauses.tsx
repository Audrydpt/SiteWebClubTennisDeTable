import { PlusCircle, X } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type WhereClause = {
  column: string;
  value: string;
};

export type WhereClausesValue = WhereClause[];

export interface WhereClausesProps
  extends React.HTMLAttributes<HTMLDivElement> {
  columns: readonly string[];
  value: WhereClausesValue;
  onValueChange: (value: WhereClausesValue) => void;
  disabled?: boolean;
}

const WhereClauses = React.forwardRef<HTMLDivElement, WhereClausesProps>(
  ({ columns, value, onValueChange, className, disabled, ...props }, ref) => {
    const handleAddClause = React.useCallback(() => {
      onValueChange([...value, { column: columns[0], value: '' }]);
    }, [onValueChange, value, columns]);

    const handleRemoveClause = React.useCallback(
      (index: number) => {
        onValueChange(value.filter((_, i) => i !== index));
      },
      [onValueChange, value]
    );

    const handleChangeClause = React.useCallback(
      (index: number, field: keyof WhereClause, newValue: string) => {
        onValueChange(
          value.map((clause, i) =>
            i === index ? { ...clause, [field]: newValue } : clause
          )
        );
      },
      [onValueChange, value]
    );

    return (
      <div ref={ref} className={cn('space-y-3', className)} {...props}>
        <div className="space-y-2">
          {Array.isArray(value) &&
            value.map((clause, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Select
                    value={clause.column}
                    onValueChange={(newValue) =>
                      handleChangeClause(index, 'column', newValue)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Input
                    placeholder="Value"
                    value={clause.value}
                    onChange={(e) =>
                      handleChangeClause(index, 'value', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleRemoveClause(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleAddClause}
          disabled={disabled}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add filter
        </Button>
      </div>
    );
  }
);
WhereClauses.displayName = 'WhereClauses';

export { WhereClauses };
