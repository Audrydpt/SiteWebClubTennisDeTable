import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

import { StepperFormData } from '../lib/export';
import { AcicAggregation, AggregationTypeToObject } from '../lib/props';
import { getWidgetDataForExport } from '../lib/utils';
import { StoredWidget } from './form-widget';

interface WidgetRangeNavigatorProps {
  widget: StepperFormData;
  updateWidgetData: (data: StoredWidget) => void;
}

export default function WidgetRangeNavigator({
  widget,
  updateWidgetData,
}: WidgetRangeNavigatorProps) {
  const [currentRange, setCurrentRange] = useState<
    { from: Date; to: Date } | undefined
  >(undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const queryClient = useQueryClient();

  if (widget.duration) {
    const to = DateTime.now().minus({ millisecond: 1 }).toJSDate();
    const from = DateTime.now()
      .minus(AggregationTypeToObject[widget.duration!])
      .toJSDate();
    setCurrentRange({ from, to });
  }
  const fetchData = async (range: { from: Date; to: Date }) => {
    const data = await getWidgetDataForExport(
      {
        table: widget.table,
        aggregation: widget.aggregation || AcicAggregation.OneHour,
        range,
        where: widget.where,
      },
      widget.groupBy || ''
    );
    updateWidgetData(data);
  };

  const handlePrevious = () => {
    if (currentRange) {
      const newTo = DateTime.fromJSDate(currentRange.from)
        .minus(AggregationTypeToObject[widget.duration!])
        .toJSDate();
      const newFrom = DateTime.fromJSDate(currentRange.from)
        .minus(AggregationTypeToObject[widget.duration!])
        .toJSDate();
      const newRange = { from: newFrom, to: newTo };
      setCurrentRange(newRange);
      fetchData(newRange);
    }
  };

  const handleNext = () => {
    if (currentRange) {
      const newFrom = DateTime.fromJSDate(currentRange.to)
        .plus({ millisecond: 1 })
        .toJSDate();
      const newTo = DateTime.fromJSDate(currentRange.to)
        .plus(AggregationTypeToObject[widget.duration!])
        .toJSDate();
      const newRange = { from: newFrom, to: newTo };
      setCurrentRange(newRange);
      fetchData(newRange);
    }
  };

  useEffect(() => {
    if (widget.range && widget.range.from && widget.range.to) {
      setCurrentRange(widget.range as { from: Date; to: Date });
    }
  }, [widget.range]);

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
