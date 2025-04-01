import { CheckCircle, Video, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from 'sonner';
import useVMSAPI from '../hooks/use-vms';

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

type VmsType = 'Milestone' | 'Genetec' | undefined;

function VMSSettings() {
  const { t } = useTranslation('settings');
  const [selectedVMS, setSelectedVMS] = useState<VmsType>(undefined);
  const [ip, setIP] = useState<string>('');
  const [port, setPort] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isIPValid, setIsIPValid] = useState<boolean | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isTestSuccessful, setIsTestSuccessful] = useState<boolean>(false);
  const [isTestAttempted, setIsTestAttempted] = useState<boolean>(false);
  const { query, edit } = useVMSAPI();

  useEffect(() => {
    if (query.data && query.data.vms) {
      const {
        type,
        ip: savedIP,
        port: savedPort,
        username: savedUsername,
        password: savedPassword,
      } = JSON.parse(query.data.vms);
      setSelectedVMS(type);
      setIP(savedIP);
      setPort(savedPort);
      setUsername(savedUsername);
      setPassword(savedPassword);
    }
  }, [query.data]);

  const isValidIP = (newIP: string): boolean => {
    // IPv4 regex pattern
    const ipv4Pattern =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Pattern.test(newIP);
  };

  const handleIPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setIP(value);

    if (value) {
      setIsIPValid(isValidIP(value));
      setIP(value);
    } else {
      setIsIPValid(undefined);
    }
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setPort(value);
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setUsername(value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setPassword(value);
  };

  const handleTestCredentials = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTestSuccessful(true);
      // eslint-disable-next-line no-console
      console.log('Testing credentials:', {
        username,
        password,
      });
      setIsTestAttempted(true);
      setIsTesting(false);
    }, 2000);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    edit(
      {
        type: selectedVMS || '',
        ip,
        port,
        username,
        password,
      },
      {
        onSuccess: () => {
          setIsSubmitting(false);
          toast(t('vms-settings.toast.success'), {
            description: t('vms-settings.toast.description', {
              type: selectedVMS,
              ip,
              port,
              username,
              password,
            }),
          });
        },
        onError: () => {
          setIsSubmitting(false);
          toast(t('vms-settings.toast.error'), {
            description: t('vms-settings.toast.errorDescription'),
          });
        },
      }
    );
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
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <span className="text-sm font-medium">
              {t('vms-settings.selectVMS')}
            </span>
            <Select
              onValueChange={(value) => setSelectedVMS(value as VmsType)}
              value={selectedVMS}
            >
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
                  value={ip}
                  onChange={handleIPChange}
                  type="text"
                  className={isIPValid === false ? 'border-red-500' : ''}
                />
                {isIPValid === false && (
                  <p className="text-sm text-red-500 mt-1">
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
                  value={port}
                  onChange={handlePortChange}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
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
                  value={username}
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
                  value={password}
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
            disabled={
              !selectedVMS ||
              !ip ||
              !port ||
              !username ||
              !password ||
              isIPValid === false
            }
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
