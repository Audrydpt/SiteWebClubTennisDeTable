/* eslint-disable */
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
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
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const timeSchema = z.object({
  range: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }),
  startTime: z.string(),
  endTime: z.string(),
}).refine((data) => {
  // Si les deux heures sont définies, vérifier que l'heure de début est avant l'heure de fin
  if (data.startTime && data.endTime) {
    return data.startTime <= data.endTime;
  }
  return true;
}, {
  message: "L'heure de début doit être antérieure à l'heure de fin",
  path: ["endTime"]
});

type TimeFormValues = z.infer<typeof timeSchema>;

interface TimesProps {
  date: string | undefined;
  onDateChange: (startDate: string | undefined, endDate?: string | undefined) => void;
  onTimeChange?: (startTime: string, endTime: string) => void;
}

export default function Times({ date, onDateChange, onTimeChange }: TimesProps) {
  const [timeError, setTimeError] = useState<string | null>(null);

  const form = useForm<TimeFormValues>({
    resolver: zodResolver(timeSchema),
    defaultValues: {
      range: {
        from: date ? new Date(date) : undefined,
        to: date ? new Date(date) : undefined,
      },
      startTime: '00:00',
      endTime: '23:59',
    },
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      // Date handling
      if (value.range?.from) {
        onDateChange(format(value.range.from, 'yyyy-MM-dd'),
          value.range?.to ? format(value.range.to, 'yyyy-MM-dd') : undefined);
      } else {
        onDateChange(undefined, undefined);
      }

      // Time handling - always pass the current time values whenever they change
      if (onTimeChange && value.startTime && value.endTime) {
        onTimeChange(value.startTime, value.endTime);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, onDateChange, onTimeChange]);

  const handleTimeChange = (field: any, value: string) => {
    field.onChange(value);

    const currentValues = form.getValues();
    if (currentValues.startTime && currentValues.endTime) {
      if (currentValues.startTime > currentValues.endTime) {
        setTimeError("L'heure de début doit être antérieure à l'heure de fin");
      } else {
        setTimeError(null);
      }

      // Always notify parent of time changes
      if (onTimeChange) {
        onTimeChange(currentValues.startTime, currentValues.endTime);
      }
    }
  };

  const isSameDay = form.watch('range')?.from && form.watch('range')?.to &&
    format(form.watch('range')?.from as Date, 'yyyy-MM-dd') ===
    format(form.watch('range')?.to as Date, 'yyyy-MM-dd');

  return (
    <AccordionItem value="time">
      <AccordionTrigger>Plage horaire</AccordionTrigger>
      <AccordionContent>
        <Form {...form}>
          <form className="space-y-6">
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
                              !field.value.from &&
                              !field.value.to &&
                              'text-muted-foreground'
                            )}
                          >
                            {!field.value.from && !field.value.to && (
                              <span>Sélectionner une plage de dates</span>
                            )}
                            {field.value.from && (
                              <span>
                                Du{' '}
                                {format(field.value.from, 'dd/MM/yyyy', {
                                  locale: fr,
                                })}
                              </span>
                            )}
                            {field.value.to && field.value.from && (
                              <span>
                                {' '}
                                au{' '}
                                {format(field.value.to, 'dd/MM/yyyy', {
                                  locale: fr,
                                })}
                              </span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={field.value as DateRange}
                          onSelect={(value) => {
                            field.onChange(value);
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                          locale={fr}
                        />
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
                      <Input
                        type="time"
                        {...field}
                        onChange={(e) => handleTimeChange(field, e.target.value)}
                      />
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
                      <Input
                        type="time"
                        {...field}
                        onChange={(e) => handleTimeChange(field, e.target.value)}
                      />
                    </FormControl>
                    {timeError && <FormMessage>{timeError}</FormMessage>}
                  </FormItem>
                )}
              />
            </div>

            {form.watch('range')?.from && (
              <div className={cn(
                "text-sm",
                timeError && isSameDay ? "text-destructive" : "text-muted-foreground"
              )}>
                Recherche du{' '}
                {form.watch('range')?.from
                  ? format(form.watch('range')?.from as Date, 'dd/MM/yyyy')
                  : ''}{' '}
                à {form.watch('startTime')}
                {form.watch('range')?.to
                  ? ` au ${format(form.watch('range')?.to as Date, 'dd/MM/yyyy')}`
                  : ''}{' '}
                à {form.watch('endTime')}
                {timeError && isSameDay && (
                  <div className="text-destructive font-medium mt-1">{timeError}</div>
                )}
              </div>
            )}
          </form>
        </Form>
      </AccordionContent>
    </AccordionItem>
  );
}