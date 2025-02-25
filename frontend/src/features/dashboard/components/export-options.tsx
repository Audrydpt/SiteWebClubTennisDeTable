import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import LoadingSpinner from '@/components/loading';
import MultiSelect from '@/components/multi-select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
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
  const { data, isSuccess, isLoading } = useQuery({
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

  // definition de l'autocompletion pour toutes les where clauses
  const whereClausesAutocompletion = React.useMemo(() => {
    if (!data) return {};

    return data.reduce(
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
    );
  }, [data]);

  const { isValid } = form.formState;

  useEffect(() => {
    if (columnKeys && isSuccess && data.length > 0 && isValid) {
      setStepValidity(true);
    } else {
      setStepValidity(false);
    }
  }, [columnKeys, isSuccess, data, isValid, setStepValidity]);

  const handleFormChange = async () => {
    // Récupérer les valeurs du formulaire
    const formValues = form.getValues();

    // Convertir le délimiteur personnalisé en virgules pour l'API si nécessaire
    if (formValues.where) {
      formValues.where = formValues.where.map((clause) => ({
        ...clause,
        value: clause.value.replace(/\|\|\|/g, ','),
      }));
    }

    updateStoredWidget(form.getValues());
    await form.trigger();
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onChange={handleFormChange}>
        <div className="flex-1">
          <FormField
            control={form.control}
            name="groupBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group by</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={columnKeys || []}
                    selected={
                      storedWidget.groupBy
                        ? storedWidget.groupBy.split(',')
                        : []
                    }
                    onChange={(selected) => {
                      field.onChange(selected.join(','));
                      handleFormChange();
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="where"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where</FormLabel>
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <WhereClausesWithSearch
                    columns={columnKeys || []}
                    value={Array.isArray(field.value) ? field.value : []}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFormChange();
                    }}
                    whereClauseAutocompletion={whereClausesAutocompletion}
                  />
                )}
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
