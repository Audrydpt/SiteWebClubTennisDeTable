import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { Duration } from 'luxon';
import { ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { getWidgetDescription } from '../lib/utils';

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
  return (
    durationDuration.as('minutes') / aggregationDuration.as('minutes') > 1440
  );
};

const formSchema = z
  .object({
    table: z.nativeEnum(AcicEvent),
    aggregation: z.nativeEnum(AcicAggregation),
    duration: z.nativeEnum(AcicAggregation),
    groupBy: z.string().optional(),
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
      message: 'Aggregation period must be smaller than or equal to duration',
      path: ['aggregation'],
    }
  )
  .refine((data) => !hasTooManyPoints(data.aggregation, data.duration), {
    message: 'Aggregation period is too small for the given duration',
    path: ['aggregation'],
  })
  .refine((data) => getLayoutOptions(data.type).includes(data.layout), {
    message: 'Layout is required',
    path: ['layout'],
  })
  .refine((data) => !(getStackedOptions(data.type) && !data.groupBy), {
    message: 'Group by is required',
    path: ['groupBy'],
  })
  .refine(
    (data) =>
      !(data.type === ChartType.Pie && data.aggregation !== data.duration),
    {
      message: 'Pie chart must have the same aggregation and duration',
      path: ['aggregation'],
    }
  )
  .refine(
    (data) =>
      !(data.type === ChartType.Heatmap && data.size !== ChartSize.full),
    {
      message: 'Heatmap should be full size',
      path: ['size'],
    }
  );
export type FormSchema = z.infer<typeof formSchema>;
export type StoredWidget = FormSchema & {
  id: string;
};

type FormWidgetProps = {
  onSubmit: (data: FormSchema) => void;
  trigger: ReactNode;
  edition?: boolean;
  defaultValues?: FormSchema;
};

export function FormWidget({
  onSubmit,
  trigger,
  edition = false,
  defaultValues,
}: FormWidgetProps) {
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['dashboard', 'add_widget'],
    queryFn: () => getWidgetDescription(),
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: ChartType.Area,
      layout: 'natural',
      table: AcicEvent.AcicCounting,
      aggregation: AcicAggregation.OneHour,
      duration: AcicAggregation.OneDay,
      size: ChartSize.medium,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        ...defaultValues,
        groupBy: defaultValues.groupBy ? defaultValues.groupBy : '', // database set null instead of undefined
      });
    }
  }, [defaultValues, form]);

  const formValues = form.watch();
  const PreviewComponent = ChartTypeComponents[formValues.type];

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

  const handleSubmit = (d: FormSchema) => {
    onSubmit(d);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {edition ? 'Edit a widget' : 'Add a widget'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-row gap-6">
          <div className="flex-1">
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
                      <FormLabel>Title</FormLabel>
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
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ChartType).map((item) => (
                            <SelectItem
                              key={item}
                              value={item}
                              disabled={
                                ExperimentalChartType[item] &&
                                process.env.NODE_ENV !== 'development'
                              }
                            >
                              {item}
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
                          <FormLabel>Layout</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select the layout" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getLayoutOptions(formValues.type).map((item) => (
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
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select the size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(ChartSize).map((item) => (
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
                </div>

                <FormField
                  control={form.control}
                  name="table"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the table" />
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

                <FormField
                  control={form.control}
                  name="groupBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group by</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={!getStackedOptions(formValues.type)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the group by" />
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
                      </Select>
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
                          <FormLabel>Aggregation</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={UniqueValuesOptions[formValues.type]}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select the aggregation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(AcicAggregation).map((item) => (
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
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select the duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(AcicAggregation).map((item) => (
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
                </div>

                <DialogFooter className="p-2">
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                  <Button type="submit">Submit</Button>
                </DialogFooter>
              </form>
            </Form>
          </div>

          <div className="flex-1 border rounded-lg p-4 bg-accent">
            <div className="h-full w-full">
              {hasTooManyPoints(formValues.aggregation, formValues.duration) ? (
                <Alert>
                  <TriangleAlert className="h-4 w-4" />
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
