import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import useExportAPI from '../hooks/use-export';

import {
  Form,
  FormControl,
  FormDescription,
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
import { AcicEvent } from '../lib/props';
import { exportSchema } from './form-export';

const baseSchema =
  exportSchema instanceof z.ZodEffects
    ? // eslint-disable-next-line no-underscore-dangle, @stylistic/indent
      exportSchema._def.schema
    : exportSchema;

const exportSourceSchema = baseSchema.shape.source.pick({
  table: true,
  startDate: true,
  endDate: true,
  streams: true,
});

type ExportSourceSchema = z.infer<typeof exportSourceSchema>;

export default function ExportSource() {
  const form = useForm<ExportSourceSchema>({
    resolver: zodResolver(exportSourceSchema),
    defaultValues: {
      table: '' as AcicEvent,
      startDate: '',
      endDate: '',
      streams: [],
    },
  });

  const { data: exportData } = useExportAPI(
    form.watch('table'),
    form.watch('startDate'),
    form.watch('endDate')
  );
  console.log(exportData);

  const onSubmit = (data: ExportSourceSchema) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormDescription>
          Select the event type, date range, and stream IDs for your export.
        </FormDescription>

        <FormField
          control={form.control}
          name="table"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(AcicEvent).map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
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
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" placeholder="Start Date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <Input type="date" placeholder="End Date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="streams"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stream IDs</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value.toString()}
                value={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stream ID">
                      {field.value ? field.value : 'Select a stream ID'}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {exportData &&
                    exportData[0] &&
                    exportData[0].map((stream: { stream_id: string }) => (
                      <SelectItem
                        key={stream.stream_id}
                        value={stream.stream_id}
                      >
                        {stream.stream_id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
