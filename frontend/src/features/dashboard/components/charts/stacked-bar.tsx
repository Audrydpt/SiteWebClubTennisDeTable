import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { StackOffsetType } from 'recharts/types/util/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import { AggregationTypeToObject, GroupByChartProps } from '../../lib/props';
import { getTimeFormattingConfig, getWidgetData } from '../../lib/utils';

type StackedBarComponentProps = GroupByChartProps & {
  layout?: 'vertical' | 'horizontal';
  stackOffset?: StackOffsetType;
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

export default function StackedBarComponent({
  layout = 'vertical',
  stackOffset = 'none',
  ...props
}: StackedBarComponentProps) {
  const { title, table, aggregation, duration, where } = props;
  const { groupBy } = props;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregation, duration, where, groupBy],
    queryFn: () =>
      getWidgetData(
        {
          table,
          aggregation,
          duration,
          where,
        },
        groupBy
      ),
    refetchInterval: Duration.fromObject(
      AggregationTypeToObject[aggregation]
    ).as('milliseconds'),
  });

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Stacked-Bar ${layout.toString()}`}</CardTitle>
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
    Object.keys(dataMerged).length,
    data.size
  );

  const lastIndex = Object.keys(chartConfig).length - 1;
  const getBarRadius = (index: number): [number, number, number, number] => {
    if (index !== lastIndex) return [0, 0, 0, 0];
    return layout === 'horizontal' ? [4, 4, 0, 0] : [0, 4, 4, 0];
  };

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Stacked-Bar ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            data={Object.values(dataMerged)}
            layout={layout}
            stackOffset={stackOffset}
          >
            <CartesianGrid
              vertical={layout === 'vertical'}
              horizontal={layout === 'horizontal'}
            />
            {layout === 'horizontal' ? (
              <>
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
                <YAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  dataKey="timestamp"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(t: string) =>
                    DateTime.fromISO(t).toFormat(format)
                  }
                  interval={interval}
                />
              </>
            )}

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
              <Bar
                key={group}
                dataKey={String(group)}
                stackId="a"
                fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                radius={getBarRadius(index)}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
