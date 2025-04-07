import { CheckCircle, Video, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { toast } from 'sonner';
import useVMSAPI from '../hooks/use-vms';
import { VMSFormValues, vmsSchema } from '../lib/types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function VMSSettings() {
  const { t } = useTranslation('settings');
  const [formData, setFormData] = useState<Partial<VMSFormValues>>({});
  const [isIPValid, setIsIPValid] = useState<boolean | undefined>(undefined);
  const [isPortValid, setIsPortValid] = useState<boolean | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isTestSuccessful, setIsTestSuccessful] = useState<boolean>(false);
  const [isTestAttempted, setIsTestAttempted] = useState<boolean>(false);
  const { query, edit } = useVMSAPI();

  useEffect(() => {
    if (query.data && query.data.vms) {
      const vmsData = query.data.vms;
      setFormData(vmsData);
    }
  }, [query.data]);

  const handleVMSTypeChange = (value: string) => {
    if (value === 'Milestone') {
      setFormData({
        ...formData,
        type: 'Milestone',
      });
    } else if (value === 'Genetec') {
      setFormData({
        ...formData,
        type: 'Genetec',
      });
    }
  };

  const isValidIP = (ip: string) => {
    const result = z.string().ip().safeParse(ip);
    return result.success;
  };

  const handleIPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFormData({ ...formData, ip: value });

    if (value) {
      setIsIPValid(isValidIP(value));
    } else {
      setIsIPValid(undefined);
    }
  };

  const isValidPort = (port: string) => {
    const portNumber = parseInt(port, 10);
    if (Number.isNaN(portNumber)) return false;
    return z.number().int().min(1).max(65535).safeParse(portNumber).success;
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const portNumber = parseInt(value, 10);
    if (!Number.isNaN(portNumber)) {
      setFormData({ ...formData, port: portNumber });
    }

    if (value) {
      setIsPortValid(isValidPort(value));
    } else {
      setIsPortValid(undefined);
    }
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (formData.type === 'Milestone') {
      setFormData((prev) => ({ ...prev, username: value }));
    }
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (formData.type === 'Milestone') {
      setFormData((prev) => ({ ...prev, password: value }));
    }
  };

  const handleTestCredentials = () => {
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

  const validateForm = () => {
    try {
      if (!formData.type) return false;
      vmsSchema.parse(formData);
      return true;
    } catch (error) {
      console.error('Form validation error:', error);
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm() || !formData.type) return;

    setIsSubmitting(true);
    edit(formData as VMSFormValues, {
      onSuccess: () => {
        setIsSubmitting(false);
        toast(t('vms-settings.toast.success'), {
          description: t('vms-settings.toast.description', {
            type: formData.type,
            ip: formData.ip,
            port: formData.port,
            username: formData.type === 'Milestone' ? formData.username : '',
            password: formData.type === 'Milestone' ? formData.password : '',
          }),
        });
      },
      onError: () => {
        setIsSubmitting(false);
        toast(t('vms-settings.toast.error'), {
          description: t('vms-settings.toast.errorDescription'),
        });
      },
    });
  };

  const isMilestone = formData.type === 'Milestone';
  const isCredentialsRequired = isMilestone;

  const isDisabled =
    !formData.type ||
    !formData.ip ||
    !formData.port ||
    isIPValid === false ||
    isPortValid === false ||
    (isCredentialsRequired && (!formData.username || !formData.password));

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
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <span className="text-sm font-medium">
              {t('vms-settings.selectVMS')}
            </span>
            <Select onValueChange={handleVMSTypeChange} value={formData.type}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('vms-settings.selectVMS')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Genetec">
                  {t('vms-settings.genetec')}
                </SelectItem>
                <SelectItem value="Milestone">
                  {t('vms-settings.milestone')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">
              {t('vms-settings.host')}
            </span>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {t('vms-settings.ipAddress')}
                </span>
                <Input
                  placeholder={t('vms-settings.selectIP')}
                  value={formData.ip || ''}
                  onChange={handleIPChange}
                  type="text"
                  className={isIPValid === false ? 'border-destructive' : ''}
                />
                {isIPValid === false && (
                  <p className="text-sm text-destructive mt-1">
                    {t('ai-settings.invalidIP')}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {t('vms-settings.port')}
                </span>
                <Input
                  placeholder={t('vms-settings.selectPort')}
                  value={formData.port?.toString() || ''}
                  onChange={handlePortChange}
                  type="text"
                  className={isPortValid === false ? 'border-destructive' : ''}
                />
                {isPortValid === false && (
                  <p className="text-sm text-destructive mt-1">
                    {t('vms-settings.invalidPort')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">
              {t('vms-settings.credentials')}
            </span>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {t('vms-settings.username')}
                </span>
                <Input
                  placeholder={t('vms-settings.selectUsername')}
                  value={formData.type === 'Milestone' ? formData.username : ''}
                  onChange={handleUsernameChange}
                  type="text"
                />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {t('vms-settings.password')}
                </span>
                <Input
                  placeholder={t('vms-settings.selectPassword')}
                  value={formData.type === 'Milestone' ? formData.password : ''}
                  onChange={handlePasswordChange}
                  type="password"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6 items-start">
            <div className="flex-shrink-0 w-25">
              <Button
                onClick={handleTestCredentials}
                variant="secondary"
                className="w-full"
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
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
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
            onClick={handleSubmit}
            className="w-full"
            disabled={isDisabled}
          >
            {isSubmitting
              ? t('vms-settings.actions.saving')
              : t('vms-settings.actions.applyChanges')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default VMSSettings;
