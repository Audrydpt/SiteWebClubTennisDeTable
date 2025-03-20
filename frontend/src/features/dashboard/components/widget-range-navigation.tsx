import { ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

import { ChartTiles } from '../DashboardTab';
import { AggregationTypeToObject } from '../lib/props';

interface WidgetRangeNavigatorProps {
  item: ChartTiles;
  updateWidgetData: (data: ChartTiles) => void;
}

export default function WidgetRangeNavigation({
  item,
  updateWidgetData,
}: WidgetRangeNavigatorProps) {
  const [currentRange, setCurrentRange] = useState<
    { from: Date; to: Date } | undefined
  >(undefined);

  useEffect(() => {
    if (item.widget.duration) {
      const to = DateTime.now().minus({ millisecond: 1 }).toJSDate();
      const from = DateTime.now()
        .minus(AggregationTypeToObject[item.widget.duration])
        .toJSDate();
      setCurrentRange({ from, to });
    }
  }, [item.widget.duration]);

  useEffect(() => {
    if (currentRange) {
      const updatedWidget = { ...item, range: currentRange };
      updateWidgetData(updatedWidget);
    }
  }, [currentRange, item, updateWidgetData]);

  const handlePrevious = () => {};

  const handleNext = () => {};

  return (
    <div>
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-pointer">
        <ChevronLeftCircle
          className="opacity-10 hover:opacity-100 transition-opacity"
          onClick={handlePrevious}
        />
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer">
        <ChevronRightCircle
          className="opacity-10 hover:opacity-100 transition-opacity"
          onClick={handleNext}
        />
      </div>
    </div>
  );
}
