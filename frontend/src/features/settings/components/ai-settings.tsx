import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import useAIAPI from '../hooks/use-ai';
import { aiSchema, AISettings } from '../lib/types';

export default function IASettings() {
  const { t } = useTranslation('settings');
  const form = useForm<AISettings>({
    resolver: zodResolver(aiSchema),
    defaultValues: {
      ip: '',
      port: 0,
      object: '',
      vehicle: '',
      person: '',
    },
  });

  // Watch IP and port values from the form
  const watchedIP = useWatch({ control: form.control, name: 'ip' });
  const watchedPort = useWatch({ control: form.control, name: 'port' });

  // Pass current form values to the hook
  const { query, describeQuery, edit } = useAIAPI({
    customIP: watchedIP,
    customPort: watchedPort && watchedPort > 0 ? watchedPort : undefined,
  });

  useEffect(() => {
    form.reset(query.data);
  }, [query.data, form]);

  const onSubmit = (data: AISettings) => {
    edit(data, {
      onSuccess: () => {
        toast(t('ai-settings.toast.success'), {
          description: t('ai-settings.toast.description', {
            ip: data.ip,
            type: data.object,
          }),
        });
      },
      onError: () => {
        toast(t('ai-settings.toast.error'), {
          description: t('ai-settings.toast.errorDescription'),
        });
      },
    });
  };

  // Function to render connection status badge
  const renderConnectionStatus = () => {
    if (!watchedIP || watchedPort <= 0) return null;
    if (describeQuery.isLoading) {
      return <Badge variant="outline">Checking connection...</Badge>;
    }
    if (describeQuery.data) {
      return <Badge variant="default">Connection successful</Badge>;
    }
    if (!describeQuery.data && describeQuery.isFetched) {
      return <Badge variant="destructive">Connection failed</Badge>;
    }
    return null;
  };

  return (
    <div className="w-full">
      <Card className="w-full h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles />
            <CardTitle>{t('ai-settings.title')}</CardTitle>
          </div>
          <CardDescription>{t('ai-settings.description')}</CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex justify-between items-center">
                  {t('ai-settings.host')}
                  {renderConnectionStatus()}
                </h3>
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="ip"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t('ai-settings.ipAddress')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('ai-settings.selectIP')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t('ai-settings.port')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('ai-settings.selectPort')}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="object"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select AI Detector</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!describeQuery.data?.detector}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t('ai-settings.selectAI')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {describeQuery.data?.detector?.map((item) => (
                          <SelectItem key={item.model} value={item.model}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Vehicle Classifier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!describeQuery.data?.classifier}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t('ai-settings.selectAI')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {describeQuery.data?.classifier?.map((item) => (
                          <SelectItem key={item.model} value={item.model}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Person Classifier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!describeQuery.data?.classifier}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t('ai-settings.selectAI')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {describeQuery.data?.classifier?.map((item) => (
                          <SelectItem key={item.model} value={item.model}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  form.formState.isSubmitting || !form.formState.isValid
                }
              >
                {form.formState.isSubmitting
                  ? t('ai-settings.actions.saving')
                  : t('ai-settings.actions.applyChanges')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
