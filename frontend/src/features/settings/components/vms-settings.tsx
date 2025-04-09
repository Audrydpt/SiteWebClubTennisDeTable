import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Video, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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

import useVMSAPI from '../hooks/use-vms';
import { VMSFormValues, vmsSchema } from '../lib/types';

export default function VMSSettings() {
  const { t } = useTranslation('settings');
  const { query, edit } = useVMSAPI();
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isTestSuccessful, setIsTestSuccessful] = useState<boolean>(false);
  const [isTestAttempted, setIsTestAttempted] = useState<boolean>(false);

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

  const vmsType = form.watch('type');

  // Charger les données existantes
  useEffect(() => {
    if (query.data && query.data.vms) {
      form.reset(query.data.vms);
    }
  }, [query.data, form]);

  const handleTestCredentials = () => {
    const formData = form.getValues();
    setIsTesting(true);
    setTimeout(() => {
      setIsTestSuccessful(true);
      // eslint-disable-next-line no-console
      console.log('Testing credentials:', {
        username: formData.type === 'Milestone' ? formData.username : '',
        password: formData.type === 'Milestone' ? formData.password : '',
      });
      setIsTestAttempted(true);
      setIsTesting(false);
    }, 2000);
  };

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vms-settings.selectVMS')}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'Genetec') {
                          // Réinitialiser les champs de Milestone si on change pour Genetec
                          form.setValue('username', '');
                          form.setValue('password', '');
                        }
                      }}
                      value={field.value}
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
                <h3 className="text-sm font-medium">
                  {t('vms-settings.host')}
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

              <div className="flex gap-4 mt-6 items-start">
                <div className="flex-shrink-0 w-25">
                  <Button
                    onClick={handleTestCredentials}
                    variant="secondary"
                    className="w-full"
                    type="button"
                    disabled={
                      !form.formState.isValid || vmsType !== 'Milestone'
                    }
                  >
                    {isTesting
                      ? t('vms-settings.actions.connecting')
                      : t('vms-settings.actions.testConnection')}
                  </Button>
                </div>

                {isTestAttempted && (
                  <div className="flex p-3 rounded-md bg-muted flex-1">
                    <div className="mr-3 mt-1">
                      {isTestSuccessful ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isTestSuccessful
                          ? t('vms-settings.connectionSuccess')
                          : t('vms-settings.connectionFailed')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
