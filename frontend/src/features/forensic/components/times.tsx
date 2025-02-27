/* eslint-disable */
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
                <Calendar className="mr-2 h-4 w-4" />
                {date ? date.toLocaleDateString() : 'Sélectionner une date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={onDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start-time" className="text-sm font-medium">
                Début
              </label>
              <Input type="time" id="start-time" />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-time" className="text-sm font-medium">
                Fin
              </label>
              <Input type="time" id="end-time" />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
