import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import {
  CustomChartLabel,
  CustomChartTickDate,
  CustomChartTickValue,
  CustomChartTooltip,
} from '@/components/charts';
import { AggregationTypeToObject, GroupByChartProps } from '../../lib/props';
import { getTimeFormattingConfig, getWidgetData } from '../../lib/utils';

type MultiBarComponentProps = GroupByChartProps & {
  layout?: 'vertical' | 'horizontal';
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

export default function MultiBarComponent({
  layout = 'vertical',
  ...props
}: MultiBarComponentProps) {
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

  const { dataMerged, chartConfig } = useMemo(() => {
    if (!data) return { dataMerged: {}, chartConfig: {} };

    return (data as DataType[]).reduce<ProcessedData>(
      (acc, item) => {
        const { timestamp, count } = item;
        const groupValue = groupBy ? item[groupBy] : 'count';

        if (!acc.dataMerged[timestamp]) {
          acc.dataMerged[timestamp] = { timestamp };
        }
        acc.dataMerged[timestamp][groupValue] =
          ((acc.dataMerged[timestamp][groupValue] as number) || 0) + count;

        if (!acc.chartConfig[groupValue]) {
          acc.chartConfig[groupValue] = {
            label: CustomChartLabel(item[groupValue], String(groupValue)),
          };
        }

        return acc;
      },
      { dataMerged: {}, chartConfig: {} }
    );
  }, [data, groupBy]);

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Multi-Bar ${layout.toString()}`}</CardTitle>
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

  const { format, interval } = getTimeFormattingConfig(
    duration,
    Object.keys(dataMerged).length,
    data.size
  );

  const getBarRadius = (): [number, number, number, number] =>
    layout === 'horizontal' ? [4, 4, 0, 0] : [0, 4, 4, 0];

  const Axis1 = layout === 'horizontal' ? XAxis : YAxis;
  const Axis2 = layout === 'horizontal' ? YAxis : XAxis;

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Multi-Bar ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={Object.values(dataMerged)} layout={layout}>
            <CartesianGrid
              vertical={layout === 'vertical'}
              horizontal={layout === 'horizontal'}
            />

            <Axis1
              dataKey="timestamp"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-30}
              tickFormatter={(t: string) => CustomChartTickDate(t, format)}
              interval={interval}
            />
            <Axis2
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: string) =>
                CustomChartTickValue(v, table === 'AcicOccupancy' ? '%' : '')
              }
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  cursor={false}
                  formatter={(...d) => CustomChartTooltip(...d, chartConfig)}
                  labelFormatter={(value, payload) =>
                    DateTime.fromISO(
                      payload[0]?.payload?.timestamp
                    ).toLocaleString(DateTime.DATETIME_MED) ?? value
                  }
                />
              }
            />
            <ChartLegend
              content={<ChartLegendContent />}
              className="flex-wrap"
            />

            {Object.keys(chartConfig).map((group, index) => (
              <Bar
                key={group}
                dataKey={String(group)}
                fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                radius={getBarRadius()}
                unit={table === 'AcicOccupancy' ? '%' : ''}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
