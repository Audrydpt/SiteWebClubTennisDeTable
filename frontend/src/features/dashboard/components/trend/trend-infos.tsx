import React, { JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { globalTrend, trendInfo } = useTrendAPI(
    dashboardKey,
    widgetId,
    widget
  );

  if (globalTrend.error || trendInfo.error) {
    return <div className="text-destructive">Error loading trend data</div>;
  }

  const trendMetrics = globalTrend.data?.global;
  const trendInfoData = trendInfo.data;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl w-[80vw] h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dashboard:trend.title')}</DialogTitle>
          <DialogDescription>
            {t('dashboard:trend.description')}
          </DialogDescription>
        </DialogHeader>
        {React.cloneElement(chart, { trendData: trendInfoData })}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="flex h-full">
              <div className="flex justify-center items-center h-full w-full">
                <Label className="text-center whitespace-normal break-words">
                  {t('dashboard:trend.avg')}: {trendMetrics?.avg.toFixed(2)}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full">
              <div className="flex justify-center items-center h-full w-full">
                <Label className="text-center whitespace-normal break-words">
                  {t('dashboard:trend.med')}: {trendMetrics?.med.toFixed(2)}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full">
              <div className="flex justify-center items-center h-full w-full">
                <Label className="text-center whitespace-normal break-words">
                  {t('dashboard:trend.std')}: {trendMetrics?.std.toFixed(2)}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full">
              <div className="flex justify-center items-center h-full w-full">
                <Label className="text-center whitespace-normal break-words">
                  {t('dashboard:trend.pc5')}: {trendMetrics?.pc5.toFixed(2)}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full">
              <div className="flex justify-center items-center h-full w-full">
                <Label className="text-center whitespace-normal break-words">
                  {t('dashboard:trend.pc95')}: {trendMetrics?.pc95.toFixed(2)}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full">
              <div className="flex justify-center items-center h-full w-full">
                <Label className="text-center whitespace-normal break-words">
                  {t('dashboard:trend.min')}: {trendMetrics?.min}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full">
              <div className="flex justify-center items-center h-full w-full">
                <Label className="text-center whitespace-normal break-words">
                  {t('dashboard:trend.max')}: {trendMetrics?.max}
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
