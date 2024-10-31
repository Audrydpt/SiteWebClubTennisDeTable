import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Skeleton } from '@/components/ui/skeleton';
import {
  AcicAggregation,
  AggregationTypeToObject,
  ChartProps,
} from '../../lib/props';
import { getWidgetData } from '../../lib/utils';

interface DataItem {
  timestamp: string;
  count: number;
}

interface ProcessedData {
  dataMerged: {
    [key: string]: DataItem[];
  };
  chartConfig: {
    maxCount: number;
  };
}
type HeatmapProps = ChartProps & {
  layout?: 'vertical' | 'horizontal';
};

const hourClasses = [
  'bg-primary/[0.05]',
  'bg-primary/[0.1]',
  'bg-primary/[0.2]',
  'bg-primary/[0.3]',
  'bg-primary/[0.4]',
  'bg-primary/[0.5]',
  'bg-primary/[0.6]',
  'bg-primary/[0.7]',
  'bg-primary/[0.8]',
  'bg-primary/[0.9]',
  'bg-primary',
];

const getOpacityClass = (count: number, maxCount: number): string => {
  if (count === 0) return 'bg-muted';
  const ratio = count / maxCount;
  const index = Math.floor(ratio * (hourClasses.length - 1));
  return hourClasses[index];
};
export default function HeatmapComponent({
  layout = 'horizontal',
  ...props
}: HeatmapProps) {
  const { title, table } = props;
  const aggregation = AcicAggregation.OneHour;
  const duration = AcicAggregation.OneWeek;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregation, duration],
    queryFn: () => getWidgetData({ table, aggregation, duration }),
    refetchInterval: Duration.fromObject(
      AggregationTypeToObject[aggregation]
    ).as('milliseconds'),
  });
  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Heatmap ${layout.toString()}`}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full bg-muted" />
          ) : (
            <span>Error !</span>
          )}
        </CardContent>
      </Card>
    );
  }

  const { dataMerged, chartConfig } = (
    data as DataItem[]
  ).reduce<ProcessedData>(
    (acc, item) => {
      const date = DateTime.fromISO(item.timestamp).toFormat('yyyy-MM-dd');

      if (!acc.dataMerged[date]) acc.dataMerged[date] = [];

      acc.dataMerged[date].push(item);
      acc.chartConfig.maxCount = Math.max(acc.chartConfig.maxCount, item.count);

      return acc;
    },
    {
      dataMerged: {},
      chartConfig: { maxCount: 0 },
    }
  );

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0')
  );

  const sortedDays = Object.keys(dataMerged).sort();

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Heatmap ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        {layout === 'horizontal' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-center">
                <th className="p-2 font-medium">Day/Hour</th>
                {hours.map((hour) => (
                  <th key={hour} className="p-2 font-medium">
                    {hour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDays.map((day) => (
                <tr key={day}>
                  <td className="p-2 font-medium">
                    {DateTime.fromISO(day).toFormat('ccc dd/MM')}
                  </td>
                  {hours.map((hour) => {
                    const hourData = dataMerged[day].find(
                      (item) =>
                        DateTime.fromISO(item.timestamp).toFormat('HH') === hour
                    );
                    const count = hourData?.count || 0;

                    return (
                      <td
                        key={hour}
                        className={`border ${getOpacityClass(
                          count,
                          chartConfig.maxCount
                        )}`}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-center">
                <th className="p-2 font-medium">Hour/Day</th>
                {sortedDays.map((day) => (
                  <th key={day} className="p-2 font-medium">
                    {DateTime.fromISO(day).toFormat('ccc dd/MM')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="p-2 font-medium">{hour}</td>
                  {sortedDays.map((day) => {
                    const hourData = dataMerged[day].find(
                      (item) =>
                        DateTime.fromISO(item.timestamp).toFormat('HH') === hour
                    );
                    const count = hourData?.count || 0;

                    return (
                      <td
                        key={day}
                        className={`border ${getOpacityClass(
                          count,
                          chartConfig.maxCount
                        )}`}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
