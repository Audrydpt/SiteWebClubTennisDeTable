import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Duration } from 'luxon';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
  LayoutOptions,
  StackedOptions,
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
  );
export type FormSchema = z.infer<typeof formSchema>;

export function AddWidget({
  onSubmit,
}: {
  onSubmit: (data: FormSchema) => void;
}) {
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

  const formValues = form.watch();
  const PreviewComponent = ChartTypeComponents[formValues.type];

  const handleSubmit = (d: FormSchema) => {
    onSubmit(d);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add a widget</DialogTitle>
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
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ChartType).map((item) => (
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

                {getStackedOptions(formValues.type) && (
                  <FormField
                    control={form.control}
                    name="groupBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group by</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                )}

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
                            defaultValue={field.value}
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
              <PreviewComponent {...formValues} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
