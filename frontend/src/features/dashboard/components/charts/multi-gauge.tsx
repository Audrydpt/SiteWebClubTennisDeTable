import { useQuery } from '@tanstack/react-query';
import { Duration } from 'luxon';
import { useMemo } from 'react';
import { RadialBar, RadialBarChart } from 'recharts';

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

import { CustomChartTooltip } from '@/components/charts';
import { AggregationTypeToObject, GroupByChartProps } from '../../lib/props';
import { getWidgetData } from '../../lib/utils';

type MultiGaugeComponentProps = GroupByChartProps & {
  layout?: 'full' | 'half';
};

interface DataType {
  timestamp: string;
  count: number;
  [key: string]: string | number;
}

interface ProcessedData {
  dataMerged: Array<{
    count: number;
    fill: string;
    [key: string]: string | number;
  }>;
  chartConfig: ChartConfig;
}

export default function MultiGaugeComponent({
  layout = 'full',
  ...props
}: MultiGaugeComponentProps) {
  const { widgetId, title, table, aggregation, duration, where, page } = props;
  const { groupBy } = props;
  const { isLoading, isError, data } = useQuery({
    queryKey: [widgetId, table, aggregation, duration, where, groupBy, page],
    queryFn: () =>
      getWidgetData(
        { widgetId, table, aggregation, duration, where },
        groupBy,
        page
      ),
    refetchInterval: Duration.fromObject(
      AggregationTypeToObject[aggregation]
    ).as('milliseconds'),
  });

  const { dataMerged, chartConfig } = useMemo(() => {
    if (!data) return { dataMerged: [], chartConfig: {} };

    return (data as DataType[]).reduce<ProcessedData>(
      (acc, item) => {
        const groupValue = groupBy ? item[groupBy] : 'count';
        const { count } = item;

        const existingGroup = acc.dataMerged.find(
          (d) => d[groupValue] === groupValue
        );

        if (existingGroup) {
          existingGroup.count += count;
        } else {
          const groupIndex = acc.dataMerged.length;
          acc.dataMerged.push({
            count,
            [groupValue]: groupValue,
            fill: `hsl(var(--chart-${(groupIndex % 5) + 1}))`,
            name: String(groupValue),
          });

          acc.chartConfig[groupValue] = {
            label: String(groupValue),
            color: `hsl(var(--chart-${(groupIndex % 5) + 1}))`,
          };
        }

        return acc;
      },
      { dataMerged: [], chartConfig: {} }
    );
  }, [data, groupBy]);

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Multi-Gauge ${layout.toString()}`}</CardTitle>
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

  return (
    <Card className="w-full h-full flex flex-col justify-center">
      <CardHeader>
        <CardTitle className="text-center">
          {title ?? `Multi-Gauge ${layout.toString()}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadialBarChart
            data={dataMerged}
            innerRadius={30}
            outerRadius={110}
            endAngle={layout === 'full' ? 360 : 180}
          >
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(...d) => CustomChartTooltip(...d, chartConfig)}
                  cursor={false}
                  labelFormatter={(_, payload) => payload[0].payload.name}
                />
              }
            />
            <ChartLegend
              content={<ChartLegendContent />}
              className="flex-wrap"
            />
            <RadialBar dataKey="count" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
