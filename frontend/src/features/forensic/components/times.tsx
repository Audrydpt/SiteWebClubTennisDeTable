/* eslint-disable */
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface TimesProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export default function Times({ date, onDateChange }: TimesProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: date,
    to: date,
  });
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('23:59');

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      onDateChange(range.from);
    } else {
      onDateChange(undefined);
    }
  };

  return (
    <AccordionItem value="time">
      <AccordionTrigger>Plage horaire</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy', { locale: fr })} -{' '}
                      {format(dateRange.to, 'dd/MM/yyyy', { locale: fr })}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy', { locale: fr })
                  )
                ) : (
                  'Sélectionner une période'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                initialFocus
                numberOfMonths={2}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start-time" className="text-sm font-medium">
                Début
              </label>
              <Input
                type="time"
                id="start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-time" className="text-sm font-medium">
                Fin
              </label>
              <Input
                type="time"
                id="end-time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          {dateRange?.from && dateRange?.to && (
            <div className="text-sm text-muted-foreground">
              Recherche du {format(dateRange.from, 'dd/MM/yyyy')} à {startTime}{' '}
              au {format(dateRange.to, 'dd/MM/yyyy')} à {endTime}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
