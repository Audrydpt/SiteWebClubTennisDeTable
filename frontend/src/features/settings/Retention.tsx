import { DatabaseIcon, Recycle } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import useRetentionAPI from './hooks/use-retention';

function Retention() {
  const [retentionDays, setRetentionDays] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { query, edit } = useRetentionAPI();

  useEffect(() => {
    if (query.data && query.data.retention) {
      const days = Number(query.data.retention);
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
        toast('Changes applied', {
          description: `Retention period successfully set to ${retentionDays} days.`,
        });
      },
      onError: () => {
        setIsSubmitting(false);
        toast('Error', {
          description: 'Failed to update retention period. Please try again.',
        });
      },
    });
  };

  const getBadgeVariant = () => {
    if (retentionDays <= 89) return 'default';
    if (retentionDays <= 364) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Recycle />
            <CardTitle>Retention</CardTitle>
          </div>
          <CardDescription>
            Visualize and define how long your data will be retained.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fine adjustment</span>
              <Badge variant={getBadgeVariant()}>{retentionDays} days</Badge>
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
                  placeholder="Custom days"
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
                  <p className="text-sm font-medium">Storage Impact</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {
                      // eslint-disable-next-line no-nested-ternary
                      retentionDays <= 30
                        ? 'Optimal space savings. Ideal for data with low historical value.'
                        : retentionDays <= 365
                          ? 'Good balance between retention and space usage.'
                          : 'Higher space usage. Recommended for critical data requiring complete history.'
                    }
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
            {isSubmitting ? 'Saving...' : 'Apply Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Retention;
