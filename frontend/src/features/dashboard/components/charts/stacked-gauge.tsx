import { useQuery } from '@tanstack/react-query';
import { Duration } from 'luxon';
import { useMemo } from 'react';
import { RadialBar, RadialBarChart } from 'recharts';
import { StackOffsetType } from 'recharts/types/util/types';

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

type StackedGaugeComponentProps = GroupByChartProps & {
  layout?: 'full' | 'half';
  stackOffset?: StackOffsetType;
};

interface DataType {
  timestamp: string;
  count: number;
  [key: string]: string | number;
}

interface ProcessedData {
  dataMerged: Array<{
    [key: string]: number;
  }>;
  chartConfig: ChartConfig;
}

export default function StackedGaugeComponent({
  layout = 'full',
  stackOffset = 'none',
  ...props
}: StackedGaugeComponentProps) {
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
    if (!data) return { dataMerged: [{}], chartConfig: {} };

    return (data as DataType[]).reduce<ProcessedData>(
      (acc, item) => {
        const groupValue = groupBy ? item[groupBy] : 'count';
        const { count } = item;

        if (!acc.dataMerged[0]) {
          acc.dataMerged[0] = {};
        }

        acc.dataMerged[0][groupValue] =
          (acc.dataMerged[0][groupValue] || 0) + count;

        if (!acc.chartConfig[groupValue]) {
          const groupIndex = Object.keys(acc.chartConfig).length;
          acc.chartConfig[groupValue] = {
            label: String(groupValue),
            color: `var(--chart-${(groupIndex % 5) + 1})`,
          };
        }

        return acc;
      },
      { dataMerged: [{}], chartConfig: {} }
    );
  }, [data, groupBy]);

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center">
        <CardHeader>
          <CardTitle className="text-left">
            {title ?? `Stacked-Gauge ${layout.toString()}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="grow w-full">
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
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title ?? `Stacked-Gauge ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadialBarChart
            data={dataMerged}
            innerRadius={80}
            outerRadius={120}
            endAngle={layout === 'full' ? 360 : 180}
            stackOffset={stackOffset}
          >
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(...d) => CustomChartTooltip(...d, chartConfig)}
                  cursor={false}
                  hideLabel
                />
              }
            />
            <ChartLegend
              content={<ChartLegendContent />}
              className="flex-wrap"
            />

            {Object.keys(chartConfig).map((key) => (
              <RadialBar
                key={key}
                dataKey={key}
                stackId="a"
                cornerRadius={5}
                fill={chartConfig[key].color}
                className="stroke-transparent stroke-2"
              />
            ))}
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
