import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileType, Loader2 } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExportStep } from '../lib/export';
import { AcicAggregation } from '../lib/props';
import { getWidgetDataForExport } from '../lib/utils';

async function getLogoAsBase64() {
  try {
    const logoUrl = new URL('/src/assets/logoACIC.png', import.meta.url).href;
    const response = await fetch(logoUrl);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

type ExportFormat = 'Excel' | 'PDF';

const exportData = (
  data: Record<string, string | number | boolean>[],
  format: ExportFormat,
  filename: string,
  setLoading: (loading: boolean) => void
) => {
  if (!data || data.length === 0) return;

  switch (format) {
    case 'Excel': {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      setLoading(false);
      break;
    }

    case 'PDF': {
      getLogoAsBase64().then((logoBase64) => {
        const worker = new Worker(
          new URL('../lib/pdfWorker.js', import.meta.url)
        );

        worker.onerror = () => {
          setLoading(false);
          worker.terminate();
        };

        worker.onmessage = (e) => {
          if (e.data.status === 'success') {
            if (e.data.data) {
              const blob = new Blob([e.data.data], {
                type: 'application/pdf',
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = e.data.filename || `${filename}.pdf`;
              document.body.appendChild(link);
              link.click();

              document.body.removeChild(link);
              setTimeout(() => URL.revokeObjectURL(url), 100);
            }
          }
          setLoading(false);
          worker.terminate();
        };

        worker.postMessage({
          data,
          filename,
          logo: logoBase64,
        });
      });
      break;
    }

    default:
      setLoading(false);
      break;
  }
};

export default function ExportStepFormat({
  storedWidget,
  updateStoredWidget,
  setStepValidity,
}: ExportStep) {
  const [loading, setLoading] = useState(false);
  const groupByColumn = storedWidget.groupBy ? storedWidget.groupBy : '';

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
    await exportData(data, format, filename, setLoading);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Export Format</Label>
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

        <Card className="p-4">
          <CardHeader>Export Summary</CardHeader>
          <CardContent>
            Table : {storedWidget.table} <br />
            Range : {storedWidget.range?.from?.toLocaleDateString()} -
            {storedWidget.range?.to?.toLocaleDateString()} <br />
            Aggregation : {storedWidget.aggregation} <br />
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
