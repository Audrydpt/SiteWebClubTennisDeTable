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

interface TypesProps {
  selectedClass: string;
  onClassChange: (value: string) => void;
}

export default function Types({ selectedClass, onClassChange }: TypesProps) {
  return (
    <AccordionItem value="type">
      <AccordionTrigger>Type de suspect</AccordionTrigger>
      <AccordionContent>
        <Select value={selectedClass} onValueChange={onClassChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner le type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Type</SelectLabel>
              <SelectItem value="person">Personne</SelectItem>
              <SelectItem value="vehicle">Véhicule</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </AccordionContent>
    </AccordionItem>
  );
}
