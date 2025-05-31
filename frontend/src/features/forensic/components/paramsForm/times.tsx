/* eslint-disable @typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps */
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { cn } from '@/lib/utils.ts';

import { ForensicFormValues } from '../../lib/types.ts';
import { useForensicForm } from '../../providers/forensic-form-context.tsx';

function DateTimePicker({
  isStart,
  selectedDate,
  hours,
  minutes,
  isOpen,
  setIsOpen,
  handleSelect,
  updateTimeValue,
  timeOptions,
  timeFrom,
}: {
  isStart: boolean;
  selectedDate?: Date;
  hours: string;
  minutes: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  handleSelect: (date: Date | undefined) => void;
  updateTimeValue: (hoursValue: string, minutesValue: string) => void;
  timeOptions: { hours: string[]; minutes: string[] };
  timeFrom?: Date;
}) {
  const { t } = useTranslation();

  const label = isStart
    ? t('forensic:times.start_date')
    : t('forensic:times.end_date');

  return (
    <FormItem className="grid gap-2">
      <FormLabel>{label}</FormLabel>
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {selectedDate
                ? format(selectedDate, 'dd/MM/yyyy', { locale: fr })
                : t('forensic:times.select_date')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              disabled={(date) =>
                date > new Date() ||
                date < new Date('1900-01-01') ||
                (!isStart &&
                  timeFrom !== undefined &&
                  date < new Date(timeFrom.getTime() - 86400000))
              }
              initialFocus
              locale={fr}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1">
          <Clock className="size-4 text-muted-foreground" />
          <Select
            value={hours}
            onValueChange={(value) => updateTimeValue(value, minutes)}
            disabled={!selectedDate}
          >
            <SelectTrigger className="w-[60px]">
              <SelectValue placeholder="H" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.hours.map((hour) => (
                <SelectItem
                  key={`${isStart ? 'start' : 'end'}-hour-${hour}`}
                  value={hour}
                >
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>:</span>
          <Select
            value={minutes}
            onValueChange={(value) => updateTimeValue(hours, value)}
            disabled={!selectedDate}
          >
            <SelectTrigger className="w-[60px]">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.minutes.map((minute) => (
                <SelectItem
                  key={`${isStart ? 'start' : 'end'}-minute-${minute}`}
                  value={minute}
                >
                  {minute}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormItem>
  );
}

export default function Times() {
  const { formMethods } = useForensicForm();
  const { control, setValue, setError, clearErrors } = formMethods;
  const { t } = useTranslation();

  const [rerender, setRerender] = useState(0);

  // Using useWatch instead of watch
  const timerange = useWatch<ForensicFormValues, 'timerange'>({
    control,
    name: 'timerange',
  });

  const timeFrom = timerange?.time_from
    ? new Date(timerange.time_from)
    : undefined;
  const timeTo = timerange?.time_to ? new Date(timerange.time_to) : undefined;

  // TODO: à enlever pour prod
  useEffect(() => {
    const now = new Date();
    const oneHourAgo = new Date(now);
    oneHourAgo.setHours(now.getHours() - 1);

    // Set the initial values
    setValue('timerange.time_to', now.toISOString());
    setValue('timerange.time_from', oneHourAgo.toISOString());
  }, [setValue]);

  // juqu'ici

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const isSameDay =
    timeFrom &&
    timeTo &&
    format(timeFrom, 'yyyy-MM-dd') === format(timeTo, 'yyyy-MM-dd');

  const hasTimeError =
    isSameDay && timeFrom && timeTo && timeFrom.getTime() > timeTo.getTime();

  // Update form error state when validation changes
  useEffect(() => {
    if (hasTimeError) {
      setError('timerange', {
        type: 'manual',
        message: "L'heure de début doit être antérieure à l'heure de fin",
      });
    } else if (timeFrom && timeTo) {
      clearErrors('timerange');
    }
  }, [hasTimeError, timeFrom, timeTo, setError, clearErrors]);

  const timerangeError = formMethods.formState.errors.timerange?.message;
  const hasError = !!timerangeError || hasTimeError;

  const timeOptions = {
    hours: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
    minutes: Array.from({ length: 60 }, (_, i) =>
      i.toString().padStart(2, '0')
    ),
  };

  const startHours = timeFrom ? format(timeFrom, 'HH') : '00';
  const startMinutes = timeFrom ? format(timeFrom, 'mm') : '00';
  const endHours = timeTo ? format(timeTo, 'HH') : '23';
  const endMinutes = timeTo ? format(timeTo, 'mm') : '59';

  // Date handlers
  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const newDate = new Date(date);
    newDate.setHours(
      timeFrom?.getHours() || 0,
      timeFrom?.getMinutes() || 0,
      0,
      0
    );
    setValue('timerange.time_from', newDate.toISOString(), {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Same for the end date if needed
    if (timeTo && newDate > timeTo) {
      const newEndDate = new Date(newDate);
      newEndDate.setHours(23, 59, 59, 999);
      setValue('timerange.time_to', newEndDate.toISOString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    setStartOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const newDate = new Date(date);
    newDate.setHours(
      timeTo?.getHours() || 23,
      timeTo?.getMinutes() || 59,
      59,
      999
    );
    setValue('timerange.time_to', newDate.toISOString(), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setEndOpen(false);
  };

  // Time handlers
  const updateStartTime = (hoursValue: string, minutesValue: string) => {
    if (!timeFrom) return;
    const newDate = new Date(timeFrom);
    newDate.setHours(
      parseInt(hoursValue, 10),
      parseInt(minutesValue, 10),
      0,
      0
    );

    setValue('timerange.time_from', newDate.toISOString(), {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Check immediately if this fixes the error
    if (timeTo && isSameDay && newDate.getTime() <= timeTo.getTime()) {
      clearErrors('timerange');
    }

    // Force re-render
    setRerender((prev) => prev + 1);
  };

  const updateEndTime = (hoursValue: string, minutesValue: string) => {
    if (!timeTo) return;

    const newDate = new Date(timeTo);
    newDate.setHours(
      parseInt(hoursValue, 10),
      parseInt(minutesValue, 10),
      59,
      999
    );

    setValue('timerange.time_to', newDate.toISOString(), {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Check immediately if this fixes the error
    if (timeFrom && isSameDay && timeFrom.getTime() <= newDate.getTime()) {
      clearErrors('timerange');
    }

    // Force re-render
    setRerender((prev) => prev + 1);
  };

  return (
    <AccordionItem value="time">
      <AccordionTrigger
        className={hasError ? 'text-destructive font-medium' : ''}
      >
        {t('forensic:times.title')}
      </AccordionTrigger>
      <AccordionContent>
        <FormField
          control={control}
          name="timerange"
          render={() => (
            <div className="grid gap-4">
              <DateTimePicker
                isStart
                selectedDate={timeFrom}
                hours={startHours}
                minutes={startMinutes}
                isOpen={startOpen}
                setIsOpen={setStartOpen}
                handleSelect={handleStartDateSelect}
                updateTimeValue={updateStartTime}
                timeOptions={timeOptions}
                timeFrom={timeFrom}
              />
              <DateTimePicker
                isStart={false}
                selectedDate={timeTo}
                hours={endHours}
                minutes={endMinutes}
                isOpen={endOpen}
                setIsOpen={setEndOpen}
                handleSelect={handleEndDateSelect}
                updateTimeValue={updateEndTime}
                timeOptions={timeOptions}
                timeFrom={timeFrom}
              />

              {timeFrom && timeTo && (
                <div
                  className={cn(
                    'text-sm',
                    hasError ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {`Recherche du ${format(timeFrom, 'dd/MM/yyyy', { locale: fr })} à ${format(timeFrom, 'HH:mm')}`}
                  {format(timeFrom, 'yyyy-MM-dd') !==
                  format(timeTo, 'yyyy-MM-dd')
                    ? ` au ${format(timeTo, 'dd/MM/yyyy', { locale: fr })}`
                    : ''}{' '}
                  à {format(timeTo, 'HH:mm')}
                </div>
              )}

              {hasError && (
                <FormMessage>
                  {timerangeError || t('forensic:times.error')}
                </FormMessage>
              )}
            </div>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  );
}
