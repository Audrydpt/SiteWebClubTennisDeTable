import { FileSpreadsheet, FileType } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExportStep } from '../lib/export';

export default function ExportStepFormat({
  storedWidget,
  updateStoredWidget,
  setStepValidity,
}: ExportStep) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Export Format</Label>
        <RadioGroup
          value={storedWidget.format}
          onValueChange={(value: 'PDF' | 'Excel') => {
            updateStoredWidget({ format: value });
            setStepValidity(true);
          }}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem value="Excel" id="excel" className="peer sr-only" />
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

        <Card className="p-4">
          <CardHeader>Export Summary</CardHeader>
          <CardContent>
            Table : {storedWidget.table} <br />
            Range : {storedWidget.range?.from?.toLocaleDateString()} -
            {storedWidget.range?.to?.toLocaleDateString()} <br />
            Group By : {storedWidget.groupBy} <br />
            Where <br />
            {storedWidget.where?.map((filter) => (
              <div key={filter.column}>
                {filter.column.charAt(0).toUpperCase() + filter.column.slice(1)}{' '}
                : {filter.value.split('|||').join(' , ')}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
