import { MoveDownRight, MoveUpRight } from 'lucide-react';
import useTrendAPI from '../../hooks/use-trend';
import { StoredWidget } from '../form-widget';

interface GlobalTrendProps {
  dashboardKey: string;
  widgetId: string;
  widget: StoredWidget;
}

export default function GlobalTrend({
  dashboardKey,
  widgetId,
  widget,
}: GlobalTrendProps) {
  const {
    data: trendValue,
    isLoading,
    error,
  } = useTrendAPI(dashboardKey, widgetId, widget);

  if (error) {
    return <div className="text-red-500">Error loading trend data</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="absolute top-4 left-4">
      {trendValue !== undefined && (
        <div className="flex flex-col gap-2">
          {trendValue > 0 ? (
            <div className="flex items-center text-green-500">
              <MoveUpRight className="h-4 w-4" />
              <span className="font-medium">{trendValue.toFixed(2)} %</span>
            </div>
          ) : (
            <div className="flex items-center text-red-500">
              <MoveDownRight className="h-4 w-4" />
              <span className="font-medium">
                {Math.abs(trendValue).toFixed(2)} %
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
