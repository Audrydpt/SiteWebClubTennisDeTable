import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@radix-ui/react-select';
import formSchema, { ExportSchema } from './form-export';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { AcicEvent } from '../lib/props';

type StepSourceProps = {
  formData: ExportSchema;
  setFormData: (data: ExportSchema) => void;
};

export default function StepSource({ formData }: StepSourceProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Form {...form}>
          <FormField
            control={form.control}
            name="source.table"
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
                    {Object.values(AcicEvent).map((eventType) => (
                      <SelectItem key={eventType} value={eventType}>
                        {eventType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source.startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source.endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source.streams"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Streams</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange([parseInt(value, 10)])
                  }
                  defaultValue={field.value?.[0]?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stream ID" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 10 }).map((_, i) => {
                      const streamId = `stream-${i}`;
                      return (
                        <SelectItem key={streamId} value={i.toString()}>
                          Stream {i}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </Form>
      </div>
    </div>
  );
}
