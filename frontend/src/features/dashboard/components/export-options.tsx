import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

import ClearableSelect from '@/components/clearable-select';
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WhereClausesWithSearch } from '@/components/where-clauses-with-search';
import { ExportStep } from '../lib/export';
import { AcicAggregation } from '../lib/props';
import { getWidgetData, getWidgetDescription } from '../lib/utils';

const exportStepSourceSchema = z.object({
  groupBy: z.string().optional(), // comment passer l'équivalent du groupBy=column1,column2,... ? peut-être il faut créer un field personnalisé ou zod est ptete capable de gérer ça dés qu'on passe plusieurs fois le même field ?
  where: z
    .array(
      z.object({
        column: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});

type ExportStepSourceFormValues = z.infer<typeof exportStepSourceSchema>;

export default function ExportStepSource({
  storedWidget,
  updateStoredWidget,
  setStepValidity,
}: ExportStep) {
  const form = useForm<ExportStepSourceFormValues>({
    resolver: zodResolver(exportStepSourceSchema),
    defaultValues: {
      groupBy: storedWidget.groupBy || '',
      where: storedWidget.where || [],
    },
  });

  const { data: columnKeys } = useQuery({
    queryKey: ['options', storedWidget.table],
    queryFn: async () => getWidgetDescription(),
    select: (data) => data[storedWidget.table],
  });

  let groupByColumn = '';
  if (columnKeys && columnKeys.length > 0) {
    groupByColumn = columnKeys.join(',');
  }

  // récupérer les données de la table pour permettre à l'utilisateur de créer des filtres sur les colonnes
  const { data, isSuccess } = useQuery({
    queryKey: [
      'export-options',
      storedWidget.table,
      storedWidget.range,
      groupByColumn,
    ],
    queryFn: async () =>
      getWidgetData(
        {
          table: storedWidget.table,
          aggregation: AcicAggregation.LifeTime,
          range: storedWidget.range,
        },
        groupByColumn
      ),
    enabled: groupByColumn.length > 0,
  });

  console.log('data', data);
  // definition de l'autocompletion pour toutes les where clauses
  const whereClausesAutocompletion =
    data?.reduce(
      (
        acc: Record<string, Set<string>>,
        item: Record<string, string | number | boolean | null>
      ) => {
        Object.entries(item).forEach(([key, value]) => {
          if (!acc[key]) {
            acc[key] = new Set();
          }
          if (value !== null && value !== undefined) {
            acc[key].add(String(value));
          }
        });
        return acc;
      },
      {}
    ) || {};
  console.log('whereClausesAutocompletion', whereClausesAutocompletion);

  const { isValid } = form.formState;

  useEffect(() => {
    if (columnKeys && isSuccess && data.length > 0 && isValid) {
      setStepValidity(true);
    } else {
      setStepValidity(false);
    }
  }, [columnKeys, isSuccess, data, isValid, setStepValidity]);

  const handleFormChange = async () => {
    updateStoredWidget(form.getValues());
    await form.trigger();
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onChange={handleFormChange}>
        <div className="flex-1">
          {/* Sans doute passer par un multi-select ou équivalent ? */}
          <FormField
            control={form.control}
            name="groupBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group by</FormLabel>
                <ClearableSelect
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFormChange();
                  }}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Group by" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {columnKeys &&
                      columnKeys.map((item: string) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </ClearableSelect>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="where"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where</FormLabel>
                <WhereClausesWithSearch
                  columns={columnKeys || []}
                  value={Array.isArray(field.value) ? field.value : []}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFormChange();
                  }}
                />
              </FormItem>
            )}
          />
          column:
          <pre>{JSON.stringify(columnKeys)}</pre>
          data:
          <pre>{JSON.stringify(data)}</pre>
        </div>
      </form>
    </Form>
  );
}
