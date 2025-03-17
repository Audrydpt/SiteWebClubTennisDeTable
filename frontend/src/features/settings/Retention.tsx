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
import { Slider } from '@/components/ui/slider';

function Retention() {
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSliderChange = (value: number[]) => {
    setRetentionDays(value[0]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
  };

  const getBadgeVariant = () => {
    if (retentionDays <= 89) return 'default';
    if (retentionDays <= 364) return 'secondary';
    return 'destructive';
  };

  const setPreset = (days: number) => {
    setRetentionDays(days);
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Recycle />
            <CardTitle>Retention Presets</CardTitle>
          </div>
          <CardDescription>
            Choose a predefined period or customize your retention duration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={retentionDays === 7 ? 'default' : 'outline'}
              onClick={() => setPreset(7)}
              className="flex flex-col h-auto py-4"
            >
              <span className="text-lg font-bold">1 week</span>
              <span className="text-xs mt-1">Short term</span>
            </Button>
            <Button
              variant={retentionDays === 30 ? 'default' : 'outline'}
              onClick={() => setPreset(30)}
              className="flex flex-col h-auto py-4"
            >
              <span className="text-lg font-bold">1 month</span>
              <span className="text-xs mt-1">Standard</span>
            </Button>
            <Button
              variant={retentionDays === 90 ? 'default' : 'outline'}
              onClick={() => setPreset(90)}
              className="flex flex-col h-auto py-4"
            >
              <span className="text-lg font-bold">3 months</span>
              <span className="text-xs mt-1">Quarterly</span>
            </Button>
            <Button
              variant={retentionDays === 180 ? 'default' : 'outline'}
              onClick={() => setPreset(180)}
              className="flex flex-col h-auto py-4"
            >
              <span className="text-lg font-bold">6 months</span>
              <span className="text-xs mt-1">Biannual</span>
            </Button>
            <Button
              variant={retentionDays === 365 ? 'default' : 'outline'}
              onClick={() => setPreset(365)}
              className="flex flex-col h-auto py-4"
            >
              <span className="text-lg font-bold">1 year</span>
              <span className="text-xs mt-1">Annual</span>
            </Button>
            <Button
              variant={retentionDays === 730 ? 'default' : 'outline'}
              onClick={() => setPreset(730)}
              className="flex flex-col h-auto py-4"
            >
              <span className="text-lg font-bold">2 years</span>
              <span className="text-xs mt-1">Biennial</span>
            </Button>
            <Button
              variant={
                ![7, 30, 90, 180, 365, 730].includes(retentionDays)
                  ? 'default'
                  : 'outline'
              }
              className="flex flex-col h-auto py-4 border-dashed"
            >
              <span className="text-xs">Custom</span>
            </Button>
          </div>

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
          </div>

          <div className="flex p-3 rounded-md bg-muted">
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
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Confirm Retention Period'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Retention;
