import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useAIAPI from '../hooks/use-ai';

type AIType = 'Car' | 'Person' | 'Object' | undefined;

function IASettings() {
  const { t } = useTranslation('settings');
  const [ip, setIP] = useState<string>('');
  const [selectedAI, setSelectedAI] = useState<AIType>(undefined);
  const [port, setPort] = useState<string>('');
  const [isIPValid, setIsIPValid] = useState<boolean | undefined>(undefined);
  const [isPortValid, setIsPortValid] = useState<boolean | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { query, edit } = useAIAPI();

  useEffect(() => {
    if (query.data && query.data.ai) {
      const { ip: savedIP, port: savedPort, type } = query.data.ai;
      setIP(savedIP);
      setPort(savedPort);
      setSelectedAI(type);
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
    } else {
      setIsIPValid(undefined);
    }
  };

  const isValidPort = (newPort: string): boolean => {
    // Port pattern: numbers only, max 4 digits
    const portPattern = /^[0-9]{1,4}$/;
    return portPattern.test(newPort);
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setPort(value);

    if (value) {
      setIsPortValid(isValidPort(value));
    } else {
      setIsPortValid(undefined);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    edit(
      {
        ip,
        port,
        type: selectedAI || '',
      },
      {
        onSuccess: () => {
          setIsSubmitting(false);
          toast(t('ai-settings.toast.success'), {
            description: t('ai-settings.toast.description', {
              ip,
              type: selectedAI,
            }),
          });
        },
        onError: () => {
          setIsSubmitting(false);
          toast(t('ai-settings.toast.error'), {
            description: t('ai-settings.toast.errorDescription'),
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
            <Sparkles />
            <CardTitle>{t('ai-settings.title')}</CardTitle>
          </div>
          <CardDescription>{t('ai-settings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="spac-y-2">
            <span className="text-sm font-medium">{t('ai-settings.host')}</span>
            <div className="flex gap-4">
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {t('ai-settings.ipAddress')}
                </span>
                <Input
                  placeholder={t('ai-settings.selectIP')}
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
                  {t('ai-settings.port')}
                </span>
                <Input
                  placeholder={t('ai-settings.selectPort')}
                  value={port}
                  onChange={handlePortChange}
                  type="text"
                  className={isPortValid === false ? 'border-red-500' : ''}
                />
                {isPortValid === false && (
                  <p className="text-sm text-red-500 mt-1">
                    {t('ai-settings.invalidPort')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">
              {t('ai-settings.selectAI')}
            </span>
            <Select
              onValueChange={(value) => setSelectedAI(value as AIType)}
              value={selectedAI}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('ai-settings.selectAI')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">{t('ai-settings.car')}</SelectItem>
                <SelectItem value="Person">
                  {t('ai-settings.person')}
                </SelectItem>
                <SelectItem value="Object">
                  {t('ai-settings.object')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={
              !selectedAI ||
              !ip ||
              !port ||
              isIPValid === false ||
              isPortValid === false
            }
          >
            {isSubmitting
              ? t('ai-settings.actions.saving')
              : t('ai-settings.actions.applyChanges')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default IASettings;
