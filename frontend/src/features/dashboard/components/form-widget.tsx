import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { Duration } from 'luxon';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import ClearableSelect from '@/components/clearable-select';
import { WhereClausesWithSearch } from '@/components/where-clauses-with-search';
import {
  ChartTypeComponents,
  ExperimentalChartType,
  LayoutOptions,
  StackedOptions,
  UniqueValuesOptions,
} from '../lib/const';
import {
  AcicAggregation,
  AcicEvent,
  AggregationTypeToObject,
  ChartSize,
  ChartType,
} from '../lib/props';
import { getWidgetData, getWidgetDescription } from '../lib/utils';

const getLayoutOptions = (chartType: ChartType): readonly string[] =>
  LayoutOptions[chartType] ?? [];

const getStackedOptions = (chartType: ChartType): boolean =>
  StackedOptions[chartType] ?? false;

const getGroupByOptions = (
  tablesDescriptions: Record<string, string[]> | undefined,
  chartTable: string
): readonly string[] => {
  if (!tablesDescriptions) return [];
  if (!tablesDescriptions[chartTable]) return [];

  return tablesDescriptions[chartTable];
};

const hasTooManyPoints = (
  aggregation: AcicAggregation,
  duration: AcicAggregation
) => {
  const aggregationDuration = Duration.fromObject(
    AggregationTypeToObject[aggregation]
  );
  const durationDuration = Duration.fromObject(
    AggregationTypeToObject[duration]
  );
  return !(
    durationDuration.as('minutes') / aggregationDuration.as('minutes') < 500 ||
    (aggregation === AcicAggregation.OneMinute &&
      duration === AcicAggregation.OneDay)
  );
};

const formSchema = z
  .object({
    table: z.nativeEnum(AcicEvent),
    aggregation: z.nativeEnum(AcicAggregation),
    duration: z.nativeEnum(AcicAggregation),
    groupBy: z.string().optional(),
    where: z.array(
      z.object({
        column: z.string(),
        value: z.string(),
      })
    ),
    size: z.nativeEnum(ChartSize),
    type: z.nativeEnum(ChartType),
    layout: z.enum(
      Object.values(LayoutOptions).flat() as [string, ...string[]]
    ),
    title: z.string().min(3),
  })
  .refine(
    (data) =>
      Duration.fromObject(AggregationTypeToObject[data.aggregation]) <=
      Duration.fromObject(AggregationTypeToObject[data.duration]),
    {
      params: { i18n: 'dashboard:validation.aggregation.tooLarge' },
      path: ['aggregation'],
    }
  )
  .refine((data) => !hasTooManyPoints(data.aggregation, data.duration), {
    params: { i18n: 'dashboard:validation.aggregation.tooManyPoints' },
    path: ['aggregation'],
  })
  .refine((data) => getLayoutOptions(data.type).includes(data.layout), {
    params: { i18n: 'dashboard:validation.layout.required' },
    path: ['layout'],
  })
  .refine(
    (data) =>
      !(data.type === ChartType.Pie && data.aggregation !== data.duration),
    {
      params: { i18n: 'dashboard:validation.pie.sameAggregation' },
      path: ['aggregation'],
    }
  )
  .refine(
    (data) =>
      !(data.type === ChartType.Heatmap && data.size !== ChartSize.full),
    {
      params: { i18n: 'dashboard:validation.heatmap.fullSize' },
      path: ['size'],
    }
  );

type WidgetSchema = z.infer<typeof formSchema>;

export type StoredWidget = WidgetSchema & {
  id?: string;
  order?: number;
};

type FormWidgetProps = {
  onSubmit: (data: StoredWidget) => void;
  children: ReactNode;
  edition?: boolean;
  defaultValues?: StoredWidget;
};

export function FormWidget({
  onSubmit,
  children,
  edition = false,
  defaultValues,
}: FormWidgetProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: ['dashboard', 'add_widget'],
    queryFn: () => getWidgetDescription(),
  });

  const form = useForm<WidgetSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: ChartType.Bar,
      layout: 'monotone',
      table: AcicEvent.AcicCounting,
      aggregation: AcicAggregation.OneHour,
      duration: AcicAggregation.OneDay,
      size: ChartSize.medium,
      where: [],
      ...defaultValues,
    },
  });

  const formValues = form.watch();
  const PreviewComponent = useMemo(
    () => ChartTypeComponents[formValues.type],
    [formValues.type]
  );

  // Set default value on change
  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  // Set the aggregation to the duration if the type is unique values
  useEffect(() => {
    if (UniqueValuesOptions[formValues.type]) {
      form.setValue('aggregation', formValues.duration);
    }
  }, [form, formValues.type, formValues.duration]);

  // Set the layout to the first option if the current one is not available
  useEffect(() => {
    if (!getLayoutOptions(formValues.type).includes(formValues.layout)) {
      form.setValue('layout', getLayoutOptions(formValues.type)[0]);
    }
  }, [form, formValues.type, formValues.layout]);

  // Set the group by to empty if the type is not stacked
  useEffect(() => {
    if (!getStackedOptions(formValues.type)) {
      form.setValue('groupBy', '');
    }
  }, [form, formValues.type, formValues.groupBy, formValues.table, data]);

  // set size to full if the type is heatmap
  useEffect(() => {
    if (formValues.type === ChartType.Heatmap) {
      form.setValue('size', ChartSize.full);
    }
  }, [form, formValues.type]);

  const handleSubmit = useCallback(
    (d: WidgetSchema) => {
      onSubmit(d);
      setOpen(false);
      form.reset();
    },
    [form, onSubmit]
  );

  let groupByColumn = '';
  if (data && data[formValues.table] && data[formValues.table].length > 0) {
    groupByColumn = data[formValues.table].join(',');
  }
  const whereClauseData = useQuery({
    queryKey: [
      'dashboard',
      'where_clause',
      formValues.table,
      formValues.aggregation,
      formValues.duration,
      groupByColumn,
    ],
    queryFn: () =>
      getWidgetData(
        {
          table: formValues.table || AcicEvent.AcicCounting,
          aggregation: formValues.aggregation,
          duration: formValues.duration,
        },
        groupByColumn
      ),
    enabled: groupByColumn.length > 0,
  });

  const whereClausesAutocompletion = useMemo(() => {
    if (!whereClauseData.data) return {};

    return whereClauseData.data.reduce(
      (
        acc: Record<string, Set<string>>,
        item: Record<string, string | number | boolean | null>
      ) => {
        Object.entries(item).forEach(([key, value]) => {
          if (!acc[key]) {
            acc[key] = new Set();
          }
          if (value !== null && value !== undefined) {
            acc[key].add(String(value));
          }
        });
        return acc;
      },
      {}
    );
  }, [whereClauseData.data]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-full sm:w-6xl sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {edition ? t('dashboard:widget.edit') : t('dashboard:widget.add')}
          </DialogTitle>
          <DialogDescription>
            {t('dashboard:widget.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-row gap-6">
          <div className="flex-1 overflow-y-auto max-h-[72vh]">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-2"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dashboard:widget.title')}</FormLabel>
                      <Input {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dashboard:widget.type.label')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t(
                                'dashboard:widget.type.placeholder'
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ChartType).map(([key, item]) => (
                            <SelectItem
                              key={item}
                              value={item}
                              disabled={
                                ExperimentalChartType[item] &&
                                process.env.NODE_ENV !== 'development'
                              }
                            >
                              {t(`dashboard:chart.${key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="layout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('dashboard:widget.layout.label')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t(
                                    'dashboard:widget.layout.placeholder'
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getLayoutOptions(formValues.type).map((item) => (
                                <SelectItem key={item} value={item}>
                                  {t(`dashboard:layout.${item}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('dashboard:widget.size.label')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t(
                                    'dashboard:widget.size.placeholder'
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(ChartSize).map((item) => (
                                <SelectItem key={item} value={item}>
                                  {t(`dashboard:size.${item}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="table"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('dashboard:widget.table.label')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t(
                                    'dashboard:widget.table.placeholder'
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(AcicEvent).map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="groupBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('dashboard:widget.groupBy.label')}
                          </FormLabel>
                          <ClearableSelect
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={!getStackedOptions(formValues.type)}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t(
                                    'dashboard:widget.groupBy.placeholder'
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getGroupByOptions(data, formValues.table).map(
                                (item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </ClearableSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="where"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('dashboard:widget.filters.label')}
                      </FormLabel>
                      <WhereClausesWithSearch
                        columns={getGroupByOptions(data, formValues.table)}
                        value={Array.isArray(field.value) ? field.value : []}
                        onValueChange={field.onChange}
                        whereClauseAutocompletion={whereClausesAutocompletion}
                        addButtonLabel={t('dashboard:whereClauseSearch.search')}
                        placeholder={t(
                          'dashboard:whereClauseSearch.placeholder'
                        )}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="aggregation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('dashboard:widget.aggregation.label')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={UniqueValuesOptions[formValues.type]}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t(
                                    'dashboard:widget.aggregation.placeholder'
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(AcicAggregation).map(
                                ([key, item]) => (
                                  <SelectItem key={item} value={item}>
                                    {t(`dashboard:time.${key}`)}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('dashboard:widget.duration.label')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t(
                                    'dashboard:widget.duration.placeholder'
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(AcicAggregation).map(
                                ([key, item]) => (
                                  <SelectItem key={item} value={item}>
                                    {t(`dashboard:time.${key}`)}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter className="p-2">
                  <DialogClose asChild>
                    <Button variant="outline">{t('close')}</Button>
                  </DialogClose>
                  <Button type="submit">{t('submit')}</Button>
                </DialogFooter>
              </form>
            </Form>
          </div>

          <div className="flex-1 border rounded-lg p-4 bg-accent">
            <div className="h-full w-full">
              {hasTooManyPoints(formValues.aggregation, formValues.duration) ? (
                <Alert>
                  <TriangleAlert className="size-4" />
                  <AlertTitle>Too many points!</AlertTitle>
                  <AlertDescription>
                    Aggregation period is too small for the given duration
                  </AlertDescription>
                </Alert>
              ) : (
                <PreviewComponent {...formValues} />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
