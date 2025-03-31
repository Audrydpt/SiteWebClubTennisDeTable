import { Video } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate an API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Here you would typically handle the API response
      console.log('VMS Settings:', {
        selectedVMS,
        ip,
        port,
        username,
        password,
      });
    }, 2000);
  };

  const handleIPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setIP(value);
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
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
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!selectedVMS || !ip || !port || !username || !password}
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
