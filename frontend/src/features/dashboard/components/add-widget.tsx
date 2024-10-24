import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Duration } from 'luxon';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AcicAggregation,
  AcicAggregationTypeToObject,
  AcicEvent,
  ChartSize,
  ChartType,
} from '../lib/types/ChartProps';

const ALLOWED_CURVE_TYPES = ['natural', 'linear', 'step'] as const;
const ALLOWED_LAYOUT_TYPES = ['horizontal', 'vertical'] as const;

const getLayoutOptions = (chartType: ChartType): readonly string[] => {
  switch (chartType) {
    case ChartType.Area:
    case ChartType.Line:
      return ALLOWED_CURVE_TYPES;
    case ChartType.Bar:
      return ALLOWED_LAYOUT_TYPES;
    default:
      return [];
  }
};

const formSchema = z
  .object({
    table: z.nativeEnum(AcicEvent),
    aggregation: z.nativeEnum(AcicAggregation),
    duration: z.nativeEnum(AcicAggregation),
    size: z.nativeEnum(ChartSize),
    type: z.nativeEnum(ChartType),
    layout: z.union([
      z.enum(ALLOWED_CURVE_TYPES),
      z.enum(ALLOWED_LAYOUT_TYPES),
    ]),
  })
  .refine(
    (data) =>
      Duration.fromObject(AcicAggregationTypeToObject[data.aggregation]) <=
      Duration.fromObject(AcicAggregationTypeToObject[data.duration]),
    {
      message: 'Aggregation period must be smaller than or equal to duration',
      path: ['aggregation'],
    }
  )
  .refine(
    (data) => {
      if (data.type === ChartType.Bar) {
        return ALLOWED_LAYOUT_TYPES.includes(
          data.layout as (typeof ALLOWED_LAYOUT_TYPES)[number]
        );
      }
      if (data.type === ChartType.Area || data.type === ChartType.Line) {
        return ALLOWED_CURVE_TYPES.includes(
          data.layout as (typeof ALLOWED_CURVE_TYPES)[number]
        );
      }
      return true;
    },
    {
      message: 'Invalid layout for selected chart type',
      path: ['layout'],
    }
  );
export type FormSchema = z.infer<typeof formSchema>;

export default function AddWidget({
  onSubmit,
}: {
  onSubmit: (data: FormSchema) => void;
}) {
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

  const chartType = form.watch('type');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a widget</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
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
                      {getLayoutOptions(chartType).map((item) => (
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
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
