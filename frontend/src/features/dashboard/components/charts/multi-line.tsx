import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { CurveType } from 'recharts/types/shape/Curve';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import { GroupByChartProps } from '../../lib/props';
import { getTimeFormattingConfig, getWidgetData } from '../../lib/utils';

type MultiLineComponentProps = GroupByChartProps & {
  layout?: CurveType;
};

interface DataType {
  timestamp: string;
  count: number;
  [key: string]: string | number;
}
interface ProcessedData {
  dataMerged: {
    [key: string]: { timestamp: string; [key: string]: number | string };
  };
  chartConfig: ChartConfig;
}

export default function MultiLineComponent({
  layout = 'natural',
  ...props
}: MultiLineComponentProps) {
  const { title, table, aggregation, duration } = props;
  const { groupBy } = props;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregation, duration, groupBy],
    queryFn: () =>
      getWidgetData(
        {
          table,
          aggregation,
          duration,
        },
        groupBy
      ),
    refetchInterval: 10 * 1000,
  });

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Multi-Line ${layout.toString()}`}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow w-full">
          <ChartContainer config={{}} className="h-full w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full bg-muted" />
            ) : (
              <span>Error !</span>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  const { dataMerged, chartConfig } = (
    data as DataType[]
  ).reduce<ProcessedData>(
    (acc, item) => {
      const { timestamp, count } = item;
      const groupValue = item[groupBy];

      if (!acc.dataMerged[timestamp]) {
        acc.dataMerged[timestamp] = { timestamp };
      }
      acc.dataMerged[timestamp][groupValue] =
        ((acc.dataMerged[timestamp][groupValue] as number) || 0) + count;

      if (!acc.chartConfig[groupValue]) {
        acc.chartConfig[groupValue] = { label: String(groupValue) };
      }

      return acc;
    },
    { dataMerged: {}, chartConfig: {} }
  );

  const { format, interval } = getTimeFormattingConfig(
    duration,
    Object.keys(dataMerged).length
  );

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Multi-Line ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            data={Object.values(dataMerged)}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-30}
              tickFormatter={(t: string) =>
                DateTime.fromISO(t).toFormat(format)
              }
              interval={interval}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  cursor={false}
                  labelFormatter={(value: string) =>
                    DateTime.fromISO(value).toLocaleString(
                      DateTime.DATETIME_MED
                    )
                  }
                />
              }
            />

            {Object.keys(chartConfig).map((group, index) => (
              <Line
                key={group}
                dataKey={String(group)}
                type={layout}
                stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
