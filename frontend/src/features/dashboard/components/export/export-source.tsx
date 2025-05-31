import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ExportStep } from '../../lib/export';
import { AcicAggregation, AcicEvent } from '../../lib/props';
import { getWidgetData } from '../../lib/utils';

const exportStepSourceSchema = z.object({
  table: z.nativeEnum(AcicEvent),
  range: z.object({
    from: z.date(),
    to: z.date(),
  }),
  stream: z.string().nonempty(),
});

type ExportStepSourceFormValues = z.infer<typeof exportStepSourceSchema>;

export default function ExportStepSource({
  storedWidget,
  updateStoredWidget,
  setStepValidity,
}: ExportStep) {
  const { t } = useTranslation();
  const form = useForm<ExportStepSourceFormValues>({
    resolver: zodResolver(exportStepSourceSchema),
    defaultValues: {
      table: storedWidget.table || AcicEvent.AcicCounting,
      range: {
        from: storedWidget.range?.from,
        to: storedWidget.range?.to,
      },
      stream: storedWidget.stream || '0',
    },
  });

  // récupérer tous les streamid existant d'une table
  const { data, isSuccess, isFetching } = useQuery({
    queryKey: ['export-source', storedWidget.table],
    queryFn: async () =>
      getWidgetData(
        {
          table: storedWidget.table,
          aggregation: AcicAggregation.LifeTime,
          duration: AcicAggregation.LifeTime,
        },
        'stream_id',
        undefined,
        false
      ),
    enabled: !!storedWidget.table,
    select: (d: { stream_id: number }[]) =>
      d
        .map(({ stream_id }) => stream_id)
        .sort((a, b) => a - b)
        .filter((e, i, self) => i === self.indexOf(e)),
  });

  const { isValid } = form.formState;

  useEffect(() => {
    if (isSuccess && data.length > 0 && isValid) {
      setStepValidity(true);
    } else {
      setStepValidity(false);
    }
  }, [isSuccess, data, isValid, setStepValidity]);

  const handleFormChange = async () => {
    updateStoredWidget(form.getValues());
    updateStoredWidget({
      groupBy: '',
      where: [],
    });
    await form.trigger();
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onChange={handleFormChange}>
        <div className="flex-1 space-y-3">
          <FormField
            control={form.control}
            name="table"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dashboard:export:source.table')}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFormChange();
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('dashboard:export:source.selectTable')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AcicEvent).map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="range"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('dashboard:export:source.range')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {!field.value.from && !field.value.to && (
                          <span>
                            {t('dashboard:export:source.selectRange')}
                          </span>
                        )}

                        {field.value.from && (
                          <span>
                            {t('dashboard:export:source.from')}{' '}
                            {field.value.from.toLocaleDateString()}
                          </span>
                        )}
                        {field.value.to && (
                          <span>
                            {t('dashboard:export:source.to')}{' '}
                            {field.value.to.toLocaleDateString()}
                          </span>
                        )}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={field.value}
                      onSelect={(value) => {
                        field.onChange(value);
                        handleFormChange();
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
        </div>
        {isFetching && (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span>{t('dashboard:export:source.fetchData')}</span>
          </div>
        )}

        {isSuccess && data.length === 0 ? (
          <div className="flex items-center justify-center space-x-2">
            <span>{t('dashboard:export:source.fetchDataError')}</span>
          </div>
        ) : (
          ''
        )}
      </form>
    </Form>
  );
}
