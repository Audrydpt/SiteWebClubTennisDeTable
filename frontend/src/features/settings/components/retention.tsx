import { DatabaseIcon, Recycle } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import useRetentionAPI from '../hooks/use-retention';

function Retention() {
  const { t } = useTranslation('settings');
  const [retentionDays, setRetentionDays] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { query, edit } = useRetentionAPI();

  useEffect(() => {
    if (query.data && query.data.retention) {
      const days = Number(query.data.retention.days);
      setRetentionDays(days);
    }
  }, [query.data]);

  const handleSliderChange = (value: number[]) => {
    setRetentionDays(value[0]);
    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (value === '') {
      setInputValue('');
      return;
    }

    const parsedValue = parseInt(value, 10);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    setInputValue(value);

    if (parsedValue >= 1 && parsedValue <= 3650) {
      setRetentionDays(parsedValue);
    }
  };

  const handleInputBlur = () => {
    const parsedValue = parseInt(inputValue, 10);

    if (Number.isNaN(parsedValue) || parsedValue < 1 || parsedValue > 3650) {
      setInputValue(retentionDays.toString());
      setInputValue('');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    edit(retentionDays, {
      onSuccess: () => {
        setIsSubmitting(false);
        toast(t('retention.toast.success'), {
          description: t('retention.toast.successDescription', {
            days: retentionDays,
          }),
        });
      },
      onError: () => {
        setIsSubmitting(false);
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

            <Slider
              defaultValue={[90]}
              max={3650}
              min={1}
              step={1}
              value={[retentionDays]}
              onValueChange={handleSliderChange}
              className="py-4"
            />

            <div className="flex gap-4 mt-6 items-start">
              <div className="flex-shrink-0 w-25">
                <Input
                  placeholder={t('retention.customDays')}
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  max={3650}
                />
              </div>

              <div className="flex p-3 rounded-md bg-muted flex-1">
                <div className="mr-3 mt-1">
                  <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
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
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={
              retentionDays === query.data?.retention ||
              isSubmitting ||
              query.isLoading
            }
          >
            {isSubmitting
              ? t('retention.actions.saving')
              : t('retention.actions.applyChanges')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Retention;
