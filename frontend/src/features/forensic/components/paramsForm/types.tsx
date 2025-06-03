import { useTranslation } from 'react-i18next';

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

const typeOptions = [{ value: 'vehicle' }, { value: 'person' }];

export default function Types() {
  const { formMethods, subjectType, setSubjectType } = useForensicForm();
  const { control } = formMethods;
  const { t } = useTranslation();

  return (
    <AccordionItem value="type">
      <AccordionTrigger>{t('forensic:types.title')}</AccordionTrigger>
      <AccordionContent>
        <FormField
          control={control}
          name="type"
          render={() => (
            <FormItem>
              <FormLabel>{t('forensic:types.type')}</FormLabel>
              <Select
                value={subjectType}
                onValueChange={(value: 'vehicle' | 'person') => {
                  setSubjectType(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{t('forensic:types.type')}</SelectLabel>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(`forensic:types.${option.value}`)}
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
