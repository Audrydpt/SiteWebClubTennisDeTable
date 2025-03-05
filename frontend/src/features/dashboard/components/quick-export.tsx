import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileType, Loader2 } from 'lucide-react';
import { DateTime } from 'luxon';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { ExportStep } from '../lib/export';
import exportData from '../lib/exportData';
import { AcicAggregation, AggregationTypeToObject } from '../lib/props';
import { getWidgetDataForExport } from '../lib/utils';

export default function QuickExport({
  storedWidget,
  updateStoredWidget,
  setStepValidity,
  children,
}: ExportStep) {
  const [loading, setLoading] = useState(false);
  const groupByColumn = storedWidget.groupBy ? storedWidget.groupBy : '';

  let timeFrom;
  let timeTo;

  if (storedWidget.aggregation && storedWidget.duration) {
    const now = DateTime.now();
    timeFrom = now.minus(AggregationTypeToObject[storedWidget.duration]);
    timeTo = now.minus({ millisecond: 1 });
    if (!storedWidget.range) {
      // eslint-disable-next-line no-param-reassign
      storedWidget.range = { from: timeFrom.toJSDate(), to: timeTo.toJSDate() };
    }
  } else if (
    storedWidget.range &&
    storedWidget.range.from &&
    storedWidget.range.to
  ) {
    timeFrom = DateTime.fromJSDate(storedWidget.range.from);
    timeTo = DateTime.fromJSDate(storedWidget.range.to);
  } else {
    throw new Error(
      'Either aggregation and duration or range must be provided'
    );
  }

  const { data, isSuccess, isLoading } = useQuery({
    queryKey: [
      'export-options',
      storedWidget.table,
      storedWidget.range,
      storedWidget.aggregation,
      storedWidget.where,
      groupByColumn,
    ],
    queryFn: async () =>
      getWidgetDataForExport(
        {
          table: storedWidget.table,
          aggregation: storedWidget.aggregation || AcicAggregation.OneHour,
          range: storedWidget.range,
          where: storedWidget.where,
        },
        groupByColumn
      ),
    enabled: true,
  });

  const handleExport = async (format: 'PDF' | 'Excel') => {
    if (!data || !isSuccess) return;

    const filename = `${storedWidget.table}_export_${new Date().toISOString().split('T')[0]}`;
    setLoading(true);
    exportData(data, format, filename, setLoading);
  };

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>Get your data quickly</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <RadioGroup
              value={storedWidget.format}
              onValueChange={(value: 'PDF' | 'Excel') => {
                updateStoredWidget({ format: value });
                setStepValidity(true);
                handleExport(value);
              }}
              disabled={!isSuccess || !data}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="Excel"
                  id="excel"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="excel"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <FileSpreadsheet className="mb-3 h-6 w-6" />
                  Excel
                </Label>
              </div>
              <div>
                <RadioGroupItem value="PDF" id="pdf" className="peer sr-only" />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <FileType className="mb-3 h-6 w-6" />
                  PDF
                </Label>
              </div>
            </RadioGroup>

            {isLoading && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Fetching date for exporting file...</span>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Generating file...</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
