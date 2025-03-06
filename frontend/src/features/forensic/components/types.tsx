import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { typeOptions } from '../lib/form-config';

interface TypesProps {
  selectedClass: string;
  onClassChange: (value: string) => void;
}

export default function Types({ selectedClass, onClassChange }: TypesProps) {
  // Set default value to "personne" if no type is selected
  useEffect(() => {
    if (!selectedClass) {
      onClassChange('vehicle');
    }
  }, [selectedClass, onClassChange]);

  return (
    <AccordionItem value="type">
      <AccordionTrigger>Type de suspect</AccordionTrigger>
      <AccordionContent>
        <Select
          value={selectedClass || 'vehicle'}
          onValueChange={onClassChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Type</SelectLabel>
              {typeOptions.map((type: string) => (
                <SelectItem key={type.toLowerCase()} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </AccordionContent>
    </AccordionItem>
  );
}
