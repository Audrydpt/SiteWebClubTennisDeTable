import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileType, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { ExportStep } from '../../lib/export';
import exportData from '../../lib/exportData';
import { AcicAggregation } from '../../lib/props';
import { getWidgetData } from '../../lib/utils';

export default function ExportStepFormat({
  storedWidget,
  updateStoredWidget,
  setStepValidity,
}: ExportStep) {
  const { t } = useTranslation();
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
      getWidgetData(
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
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>{t('dashboard:export:format.label')}</Label>
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
              {t('dashboard:export:format.Excel')}
            </Label>
          </div>
          <div>
            <RadioGroupItem value="PDF" id="pdf" className="peer sr-only" />
            <Label
              htmlFor="pdf"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <FileType className="mb-3 h-6 w-6" />
              {t('dashboard:export:format.PDF')}
            </Label>
          </div>
        </RadioGroup>

        {isLoading && (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>{t('dashboard:export:format.fetchingMessage')}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>{t('dashboard:export:format.generatingMessage')}</span>
          </div>
        )}

        <Card className="p-4">
          <CardHeader>{t('dashboard:export:format.summary')}</CardHeader>
          <CardContent>
            {t('dashboard:export:format.table')} : {storedWidget.table} <br />
            {t('dashboard:export:format.range')} :{' '}
            {storedWidget.range?.from?.toLocaleDateString()} -
            {storedWidget.range?.to?.toLocaleDateString()} <br />
            {t('dashboard:export:format.aggregation')} :{' '}
            {storedWidget.aggregation} <br />
            {t('dashboard:export:format.groupBy')} : {storedWidget.groupBy}{' '}
            <br />
            {t('dashboard:export:format.filters')} <br />
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
