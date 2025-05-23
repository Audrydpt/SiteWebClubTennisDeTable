import { zodResolver } from '@hookform/resolvers/zod';
import { Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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

import { Badge } from '@/components/ui/badge';
import useVMSAPI from '../hooks/use-vms';
import { VMSFormValues, vmsSchema } from '../lib/types';

export default function VMSSettings() {
  const { t } = useTranslation('settings');
  const [formKey, setFormKey] = useState(0);

  const form = useForm<VMSFormValues>({
    resolver: zodResolver(vmsSchema),
    defaultValues: {
      type: undefined,
      ip: '',
      port: 0,
      username: '',
      password: '',
    },
    mode: 'onChange',
  });

  const customValue = useWatch({ control: form.control });
  const { query, describeQuery, edit } = useVMSAPI({
    customValue:
      customValue.ip && customValue.port
        ? (customValue as VMSFormValues)
        : undefined,
  });

  const vmsType = form.watch('type');

  // Charger les données existantes
  useEffect(() => {
    if (query.data) {
      form.reset({
        type: query.data.type,
        ip: query.data.ip,
        port: query.data.port,
        username: query.data.username || '',
        password: query.data.password || '',
      });

      // Force re-render the form to ensure select gets updated
      setFormKey((prev) => prev + 1);
    }
  }, [query.data, form]);

  // Clear credentials if type changes to Genetec
  useEffect(() => {
    if (vmsType === 'Genetec') {
      form.setValue('username', '', { shouldValidate: true });
      form.setValue('password', '', { shouldValidate: true });
    }
  }, [vmsType, form]);

  const onSubmit = (data: VMSFormValues) => {
    edit(data, {
      onSuccess: () => {
        toast(t('vms-settings.toast.success'), {
          description: t('vms-settings.toast.description', {
            type: data.type,
            ip: data.ip,
            port: data.port,
            username: data.type === 'Milestone' ? data.username : '',
            password: data.type === 'Milestone' ? data.password : '',
          }),
        });
      },
      onError: () => {
        toast(t('vms-settings.toast.error'), {
          description: t('vms-settings.toast.errorDescription'),
        });
      },
    });
  };

  // Function to render connection status badge
  const renderConnectionStatus = () => {
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
            <Video />
            <CardTitle>{t('vms-settings.title')}</CardTitle>
          </div>
          <CardDescription>{t('vms-settings.description')}</CardDescription>
        </CardHeader>

        <Form {...form} key={formKey}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vms-settings.selectVMS')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('vms-settings.selectVMS')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Genetec">
                          {t('vms-settings.genetec')}
                        </SelectItem>
                        <SelectItem value="Milestone">
                          {t('vms-settings.milestone')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <h3 className="text-sm font-medium flex justify-between items-center">
                  {t('vms-settings.host')}
                  {renderConnectionStatus()}
                </h3>
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="ip"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t('vms-settings.ipAddress')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('vms-settings.selectIP')}
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
                        <FormLabel>{t('vms-settings.port')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('vms-settings.selectPort')}
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

              {vmsType === 'Milestone' && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    {t('vms-settings.credentials')}
                  </h3>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t('vms-settings.username')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('vms-settings.selectUsername')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t('vms-settings.password')}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t('vms-settings.selectPassword')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting
                  ? t('vms-settings.actions.saving')
                  : t('vms-settings.actions.applyChanges')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
