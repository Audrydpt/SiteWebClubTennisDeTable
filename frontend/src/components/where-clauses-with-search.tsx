import { PlusCircle, X } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import MultiSelect from './multi-select';

export type WhereClauseWithSearch = {
  column: string;
  value: string;
};

export type WhereClausesWithSearchValue = WhereClauseWithSearch[];

export interface WhereClausesWithSearchProps
  extends React.HTMLAttributes<HTMLDivElement> {
  columns: readonly string[];
  value: WhereClausesWithSearchValue;
  onValueChange: (value: WhereClausesWithSearchValue) => void;
  disabled?: boolean;
  whereClauseAutocompletion: Record<string, Set<string>>;
  addButtonLabel?: string;
  placeholder?: string;
}

const DELIMITER = '|||';

function WhereClausesWithSearch({
  columns,
  value,
  onValueChange,
  className,
  disabled,
  whereClauseAutocompletion,
  addButtonLabel = 'Add filter',
  placeholder,
  ...props
}: WhereClausesWithSearchProps) {
  const getAvailableColumns = React.useCallback(
    (currentIndex?: number) => {
      const selectedColumns = value
        .filter((_, index) => index !== currentIndex)
        .map((clause) => clause.column);
      return columns.filter((column) => !selectedColumns.includes(column));
    },
    [columns, value]
  );

  const handleAddClause = React.useCallback(() => {
    const availableColumn = getAvailableColumns().at(0);
    if (availableColumn) {
      onValueChange([...value, { column: availableColumn, value: '' }]);
    }
  }, [getAvailableColumns, onValueChange, value]);

  const handleRemoveClause = React.useCallback(
    (index: number) => {
      onValueChange(value.filter((_, i) => i !== index));
    },
    [onValueChange, value]
  );

  const handleChangeClause = React.useCallback(
    (index: number, field: keyof WhereClauseWithSearch, newValue: string) => {
      onValueChange(
        value.map((clause, i) => {
          if (i !== index) return clause;

          const updatedClause = {
            ...clause,
            [field]: newValue,
          };

          if (field === 'column') {
            updatedClause.value = '';
          }

          return updatedClause;
        })
      );
    },
    [onValueChange, value]
  );

  return (
    <div className={cn('space-y-3', className)} {...props}>
      <div className="space-y-2">
        {value.map((clause, index) => (
          <div key={clause.column} className="flex gap-2 items-center">
            <div className="flex-1 min-w-[150px]">
              <Select
                value={clause.column}
                onValueChange={(newValue) =>
                  handleChangeClause(index, 'column', newValue)
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableColumns(index).map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <MultiSelect
                options={Array.from(
                  whereClauseAutocompletion[clause.column] || []
                )}
                selected={clause.value ? clause.value.split(DELIMITER) : []}
                onChange={(selected) =>
                  handleChangeClause(index, 'value', selected.join(DELIMITER))
                }
                placeholder={placeholder}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => handleRemoveClause(index)}
              disabled={disabled}
              aria-label="Remove filter"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-full border-input"
        onClick={handleAddClause}
        disabled={disabled || value.length >= columns.length}
        aria-label={addButtonLabel}
      >
        <PlusCircle className="mr-2 size-4" />
        {addButtonLabel}
      </Button>
    </div>
  );
}
WhereClausesWithSearch.displayName = 'WhereClauses';

export { WhereClausesWithSearch };
