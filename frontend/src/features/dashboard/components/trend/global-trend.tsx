import { MoveDownRight, MoveUpRight } from 'lucide-react';

import { JSX } from 'react';
import useTrendAPI from '../../hooks/use-trend';
import { StoredWidget } from '../form-widget';
import TrendInfos from './trend-infos';

interface GlobalTrendProps {
  dashboardKey: string;
  widgetId: string;
  widget: StoredWidget;
  chart: JSX.Element;
}

export default function GlobalTrend({
  dashboardKey,
  widgetId,
  widget,
  chart,
}: GlobalTrendProps) {
  const { trendAvg: trendValue } = useTrendAPI(dashboardKey, widgetId, widget);

  if (trendValue.error) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4">
      {trendValue.data !== undefined && (
        <div className="flex flex-col gap-2">
          <TrendInfos
            dashboardKey={dashboardKey}
            widgetId={widgetId}
            widget={widget}
            chart={chart}
          >
            {trendValue.data > 0 ? (
              <div className="flex items-center text-primary cursor-pointer hover:underline">
                <MoveUpRight className="size-4" />
                <span className="font-medium">
                  {(trendValue.data * 100).toFixed(2)} %
                </span>
              </div>
            ) : (
              <div className="flex items-center text-destructive cursor-pointer hover:underline">
                <MoveDownRight className="size-4" />
                <span className="font-medium">
                  {(Math.abs(trendValue.data) * 100).toFixed(2)} %
                </span>
              </div>
            )}
          </TrendInfos>
        </div>
      )}
    </div>
  );
}
