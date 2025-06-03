import { zodResolver } from '@hookform/resolvers/zod';
import { DatabaseIcon, Recycle } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  formSchema,
  FormValues,
  useRetentionAPI,
} from '../hooks/use-retention';

function Retention() {
  const { t } = useTranslation('settings');
  const { query, edit } = useRetentionAPI();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      days: 31,
    },
  });

  const { watch } = form;
  const retentionDays = watch('days');

  useEffect(() => {
    form.reset(query.data);
  }, [query.data, form]);

  const onSubmit = async (data: FormValues) => {
    edit(data, {
      onSuccess: () => {
        toast(t('retention.toast.success'), {
          description: t('retention.toast.successDescription', {
            days: data.days,
          }),
        });
      },
      onError: () => {
        toast(t('retention.toast.error'), {
          description: t('retention.toast.errorDescription'),
        });
      },
    });
  };

  const getBadgeVariant = () => {
    if (retentionDays <= 89) return 'default';
    if (retentionDays <= 364) return 'secondary';
    return 'destructive';
  };

  const getStorageImpactMessage = () => {
    if (retentionDays <= 30) return t('retention.storageImpact.optimal');
    if (retentionDays <= 365) return t('retention.storageImpact.balanced');
    return t('retention.storageImpact.high');
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Recycle />
            <CardTitle>{t('retention.title')}</CardTitle>
          </div>
          <CardDescription>{t('retention.description')}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {t('retention.fineAdjustment')}
                  </span>
                  <Badge variant={getBadgeVariant()}>
                    {retentionDays} {t('retention.days')}
                  </Badge>
                </div>

                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormControl>
                        <Slider
                          defaultValue={[90]}
                          max={3650}
                          min={1}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 mt-6 items-start">
                  <div className="shrink-0 w-25">
                    <FormField
                      control={form.control}
                      name="days"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder={t('retention.customDays')}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={3650}
                              value={field.value || ''}
                              onChange={(e) => {
                                const { value } = e.target;
                                if (value === '') {
                                  return;
                                }
                                const parsedValue = parseInt(value, 10);
                                if (
                                  !Number.isNaN(parsedValue) &&
                                  parsedValue >= 1 &&
                                  parsedValue <= 3650
                                ) {
                                  field.onChange(parsedValue);
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex p-3 rounded-md bg-muted flex-1">
                    <div className="mr-3 mt-1">
                      <DatabaseIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t('retention.storageImpact.title')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getStorageImpactMessage()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={
                  Number(query.data?.retention?.days) === retentionDays ||
                  form.formState.isSubmitting ||
                  query.isLoading
                }
              >
                {form.formState.isSubmitting
                  ? t('retention.actions.saving')
                  : t('retention.actions.applyChanges')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

export default Retention;
