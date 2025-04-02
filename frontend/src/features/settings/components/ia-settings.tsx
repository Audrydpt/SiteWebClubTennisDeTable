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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { query, edit } = useAIAPI();

  useEffect(() => {
    if (query.data && query.data.ai) {
      const { ip: savedIP, type } = JSON.parse(query.data.ai);
      setIP(savedIP);
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
      setIP(value);
    } else {
      setIsIPValid(undefined);
    }
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setPort(value);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    edit(
      {
        ip,
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
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
            disabled={!selectedAI || !ip || !port || isIPValid === false}
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
