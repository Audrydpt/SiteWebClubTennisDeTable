import { Sparkles } from 'lucide-react';
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

type AIType = 'Car' | 'Person' | 'Object' | undefined;

function IASettings() {
  const { t } = useTranslation('settings');
  const [ip, setIP] = useState<string>('');
  const [selectedAI, setSelectedAI] = useState<AIType>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate an API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Here you would typically handle the API response
      console.log('AI Settings:', {
        ip,
        selectedAI,
      });
    }, 2000);
  };

  const handleIPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setIP(value);
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
            disabled={!selectedAI || !ip}
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
