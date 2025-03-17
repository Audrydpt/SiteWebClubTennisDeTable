import { DatabaseIcon, Recycle } from 'lucide-react';
import { useState } from 'react';

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

function Retention() {
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [inputValue, setInputValue] = useState<string>('30');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSliderChange = (value: number[]) => {
    setRetentionDays(value[0]);
    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    // Allow empty input for better user experience while typing
    if (value === '') {
      setInputValue('');
      return;
    }

    // Check if input is a valid integer
    const parsedValue = parseInt(value, 10);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    // Update input field
    setInputValue(value);

    // Update slider if value is within valid range
    if (parsedValue >= 1 && parsedValue <= 730) {
      setRetentionDays(parsedValue);
    }
  };

  const handleInputBlur = () => {
    // When input loses focus, ensure value is within bounds
    const parsedValue = parseInt(inputValue, 10);

    if (Number.isNaN(parsedValue) || parsedValue < 1) {
      setInputValue('1');
      setRetentionDays(1);
    } else if (parsedValue > 730) {
      setInputValue('730');
      setRetentionDays(730);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 2000);
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
              defaultValue={[30]}
              max={730}
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
                  max={730}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Apply Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Retention;
