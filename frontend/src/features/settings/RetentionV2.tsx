import { DatabaseIcon, Recycle } from 'lucide-react';
import { useState } from 'react';

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

function RetentionV2() {
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSliderChange = (value: number[]) => {
    setRetentionDays(value[0]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 2000);
  };

  const getCircleSize = () => {
    // Define key points for the scale
    const scalePoints = [
      { days: 1, percentage: 5 },
      { days: 7, percentage: 10 },
      { days: 30, percentage: 20 },
      { days: 90, percentage: 30 },
      { days: 180, percentage: 50 },
      { days: 365, percentage: 75 },
      { days: 730, percentage: 100 },
    ];

    // Find the appropriate scale points for interpolation
    let lowerPoint = scalePoints[0];
    let upperPoint = scalePoints[scalePoints.length - 1];

    for (let i = 0; i < scalePoints.length - 1; i += 1) {
      if (
        retentionDays >= scalePoints[i].days &&
        retentionDays <= scalePoints[i + 1].days
      ) {
        lowerPoint = scalePoints[i];
        upperPoint = scalePoints[i + 1];
        break;
      }
    }

    // Linear interpolation between the two points
    if (retentionDays === lowerPoint.days) {
      return lowerPoint.percentage;
    }

    const daysRange = upperPoint.days - lowerPoint.days;
    const percentageRange = upperPoint.percentage - lowerPoint.percentage;
    const daysProgress = retentionDays - lowerPoint.days;

    return lowerPoint.percentage + (daysProgress / daysRange) * percentageRange;
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
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 rounded-full bg-muted flex items-center justify-center">
                <div
                  className={`rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${
                    // eslint-disable-next-line no-nested-ternary
                    retentionDays < 90
                      ? 'bg-primary shadow hover:bg-primary/90'
                      : retentionDays < 365
                        ? 'bg-secondary shadow-sm hover:bg-secondary/80'
                        : 'bg-destructive shadow-sm hover:bg-destructive/90'
                  }`}
                  style={{
                    width: `${getCircleSize()}%`,
                    height: `${getCircleSize()}%`,
                  }}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold">{retentionDays}</div>
                    <div className="text-xs text-muted-foreground">days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Slider
              defaultValue={[30]}
              max={730}
              min={1}
              step={1}
              value={[retentionDays]}
              onValueChange={handleSliderChange}
              className="py-4"
            />

            <div className="grid grid-cols-7 gap-2 mt-6">
              {[
                { days: 7, label: '1 week' },
                { days: 30, label: '1 month' },
                { days: 90, label: '3 months' },
                { days: 180, label: '6 months' },
                { days: 365, label: '1 year' },
                { days: 730, label: '2 years' },
              ].map((period) => (
                <Button
                  key={period.days}
                  variant={
                    retentionDays === period.days ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setRetentionDays(period.days)}
                  className="flex flex-col h-auto py-4"
                >
                  {period.label}
                </Button>
              ))}
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
            {isSubmitting ? 'Saving...' : 'Apply Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default RetentionV2;
