import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForensicForm } from '../lib/provider/forensic-form-context';

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
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelect: (date: Date | undefined) => void;
  updateTimeValue: (hoursValue: string, minutesValue: string) => void;
  timeOptions: { hours: string[]; minutes: string[] };
  timeFrom?: Date;
}) {
  const label = isStart ? 'Date de début' : 'Date de fin';

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
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate
                ? format(selectedDate, 'dd/MM/yyyy', { locale: fr })
                : 'Sélectionner une date'}
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
                (!isStart && timeFrom ? date < timeFrom : false)
              }
              initialFocus
              locale={fr}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
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
  const { control, watch, setValue } = formMethods;

  const timerange = watch('timerange');
  const timeFrom = timerange?.time_from
    ? new Date(timerange.time_from)
    : undefined;
  const timeTo = timerange?.time_to ? new Date(timerange.time_to) : undefined;

  const [startOpen, setStartOpen] = React.useState(false);
  const [endOpen, setEndOpen] = React.useState(false);

  const isSameDay =
    timeFrom &&
    timeTo &&
    format(timeFrom, 'yyyy-MM-dd') === format(timeTo, 'yyyy-MM-dd');

  const hasTimeError =
    isSameDay && timeFrom && timeTo && timeFrom.getTime() > timeTo.getTime(); // 🔥 Vérification simple avec getTime()

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
    setValue('timerange.time_from', newDate.toISOString());

    if (timeTo && newDate > timeTo) {
      const newEndDate = new Date(newDate);
      newEndDate.setHours(23, 59, 59, 999);
      setValue('timerange.time_to', newEndDate.toISOString());
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
    setValue('timerange.time_to', newDate.toISOString());
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
    if (isSameDay && timeTo && newDate > timeTo) return;
    setValue('timerange.time_from', newDate.toISOString());
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

    // 🔥 Suppression de la restriction qui bloquait la modification de endTime
    setValue('timerange.time_to', newDate.toISOString());
  };

  return (
    <AccordionItem value="time">
      <AccordionTrigger>Plage temporelle</AccordionTrigger>
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
                    hasTimeError ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {`Recherche du ${format(timeFrom, 'dd/MM/yyyy', { locale: fr })} à ${format(timeFrom, 'HH:mm')}`}
                  {format(timeFrom, 'yyyy-MM-dd') !==
                  format(timeTo, 'yyyy-MM-dd')
                    ? ` au ${format(timeTo, 'dd/MM/yyyy', { locale: fr })}`
                    : ''}{' '}
                  à {format(timeTo, 'HH:mm')}
                  {hasTimeError && (
                    <div className="text-destructive font-medium mt-1">
                      L&apos;heure de début doit être antérieure à l&apos;heure
                      de fin
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  );
}
