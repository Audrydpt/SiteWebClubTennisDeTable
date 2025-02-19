import { useState } from 'react';

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
import { zodResolver } from '@hookform/resolvers/zod';
import { AcicEvent } from '../lib/props';
import formSchema, { ExportSchema } from './form-export';

export default function ExportSource(formData: ExportSchema, setFormData) {
  const [data, setData] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as ExportSchema,
  });

  return (
    <Form {...formData}>
      <form onSubmit={Form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormDescription>
          Select the event type, date range, and stream IDs for your export.
        </FormDescription>

        <FormField
          control={formData.control}
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
          control={formData.control}
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
          control={formData.control}
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
          control={formData.control}
          name="streams"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stream IDs</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stream ID" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {data?.map((item) => (
                    <SelectItem key={item.stream_id} value={item.stream_id}>
                      {item.stream_id}
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
