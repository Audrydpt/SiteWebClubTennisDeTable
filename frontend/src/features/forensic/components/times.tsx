import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const timeSchema = z.object({
  range: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }),
  startTime: z.string(),
  endTime: z.string(),
});

type TimeFormValues = z.infer<typeof timeSchema>;

interface TimesProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export default function Times({ date, onDateChange }: TimesProps) {
  const form = useForm<TimeFormValues>({
    resolver: zodResolver(timeSchema),
    defaultValues: {
      range: date
        ? { from: date, to: date }
        : { from: undefined, to: undefined },
      startTime: '00:00',
      endTime: '23:59',
    },
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.range?.from) {
        onDateChange(value.range.from);
      } else {
        onDateChange(undefined);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onDateChange]);

  const handleFormChange = () => {
    // Form has changed, we could add additional logic here if needed
  };

  return (
    <AccordionItem value="time">
      <AccordionTrigger>Plage horaire</AccordionTrigger>
      <AccordionContent>
        <Form {...form}>
          <form className="space-y-6" onChange={handleFormChange}>
            <div className="flex-1 space-y-3">
              <FormField
                control={form.control}
                name="range"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Dates:</FormLabel>
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
                              <span>Sélectionner une plage de dates</span>
                            )}

                            {field.value.from && (
                              <span>
                                Du {field.value.from.toLocaleDateString()}
                              </span>
                            )}
                            {field.value.to && (
                              <span>
                                {' '}
                                au {field.value.to.toLocaleDateString()}
                              </span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col">
                            <FormLabel>Date début:</FormLabel>
                            <Input
                              type="date"
                              value={
                                field.value.from
                                  ? field.value.from.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) => {
                                const newDate = e.target.value
                                  ? new Date(e.target.value)
                                  : undefined;
                                field.onChange({
                                  ...field.value,
                                  from: newDate,
                                });
                                handleFormChange();
                              }}
                              max={
                                field.value.to
                                  ? field.value.to.toISOString().split('T')[0]
                                  : undefined
                              }
                            />
                          </div>
                          <div className="flex flex-col">
                            <FormLabel>Date fin:</FormLabel>
                            <Input
                              type="date"
                              value={
                                field.value.to
                                  ? field.value.to.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) => {
                                const newDate = e.target.value
                                  ? new Date(e.target.value)
                                  : undefined;
                                field.onChange({
                                  ...field.value,
                                  to: newDate,
                                });
                                handleFormChange();
                              }}
                              min={
                                field.value.from
                                  ? field.value.from.toISOString().split('T')[0]
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure début</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure fin</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch('range')?.from && form.watch('range')?.to && (
              <div className="text-sm text-muted-foreground">
                Recherche du {form.watch('range')?.from?.toLocaleDateString()} à{' '}
                {form.watch('startTime')} au{' '}
                {form.watch('range')?.to?.toLocaleDateString()} à{' '}
                {form.watch('endTime')}
              </div>
            )}
          </form>
        </Form>
      </AccordionContent>
    </AccordionItem>
  );
}
