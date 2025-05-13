import { JSX, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import useTrendAPI from '../../hooks/use-trend';
import { StoredWidget } from '../form-widget';

interface TrendInfoProps {
  dashboardKey: string;
  widgetId: string;
  widget: StoredWidget;
  children?: React.ReactNode;
  chart: JSX.Element;
}

export default function TrendInfos({
  dashboardKey,
  widgetId,
  widget,
  children,
  chart,
}: TrendInfoProps) {
  const [open, setOpen] = useState(false);
  const { globalTrend, trendInfo } = useTrendAPI(
    dashboardKey,
    widgetId,
    widget
  );

  if (globalTrend.error || trendInfo.error) {
    return <div className="text-red-500">Error loading trend data</div>;
  }

  const trendMetrics = globalTrend.data?.global;
  console.log('trendInfo widget ', widgetId, ' : ', trendMetrics);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl w-[80vw] h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trend Information</DialogTitle>
          <DialogDescription>
            This is the trend information for the selected widget.
          </DialogDescription>
        </DialogHeader>
        {chart}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent>
              <Label>Moyenne: {trendMetrics?.avg.toFixed(2)} %</Label>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Label>Médiane: {trendMetrics?.med.toFixed(2)}</Label>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Label>Variance: {trendMetrics?.std.toFixed(2)}</Label>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Label>Percentile 5%: {trendMetrics?.pc5.toFixed(2)}</Label>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Label>Percentile 95%: {trendMetrics?.pc95.toFixed(2)}</Label>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Label>Minimum: {trendMetrics?.min}</Label>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Label>Maximum: {trendMetrics?.max}</Label>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
