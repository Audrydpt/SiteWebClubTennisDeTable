import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { FormField, FormItem, FormLabel } from '@/components/ui/form.tsx';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

import { useForensicForm } from '../../providers/forensic-form-context.tsx';

const typeOptions = [
  { value: 'vehicle', label: 'Véhicule' },
  { value: 'person', label: 'Personne' },
];

export default function Types() {
  const { formMethods, subjectType, setSubjectType } = useForensicForm();
  const { control } = formMethods;

  return (
    <AccordionItem value="type">
      <AccordionTrigger>Type de suspect</AccordionTrigger>
      <AccordionContent>
        <FormField
          control={control}
          name="type"
          render={() => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                value={subjectType}
                onValueChange={(value: 'vehicle' | 'person') => {
                  setSubjectType(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Type</SelectLabel>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  );
}
