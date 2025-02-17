import { useQuery } from '@tanstack/react-query';
import { Duration } from 'luxon';
import { useMemo } from 'react';
import { Pie, PieChart } from 'recharts';

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

type PieComponentProps = GroupByChartProps & {
  layout?: 'pie' | 'donut' | 'halfpie' | 'halfdonut';
  gap?: number;
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
    name: string;
    [key: string]: string | number;
  }>;
  chartConfig: ChartConfig;
}

export default function PieComponent({
  layout = 'pie',
  gap = 0,
  ...props
}: PieComponentProps) {
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
    if (!data) return { dataMerged: [], chartConfig: {} };

    const processed = (data as DataType[]).reduce<ProcessedData>(
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
          const color = `hsl(var(--chart-${(groupIndex % 5) + 1}))`;

          acc.dataMerged.push({
            count,
            [groupValue]: groupValue,
            name: String(groupValue),
            fill: color,
          });

          acc.chartConfig[groupValue] = {
            label: String(groupValue),
            color,
          };
        }

        return acc;
      },
      { dataMerged: [], chartConfig: {} }
    );

    const sortedData = processed.dataMerged
      .slice()
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({
        ...item,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      }));

    return {
      dataMerged: sortedData,
      chartConfig: processed.chartConfig,
    };
  }, [data, groupBy]);

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Pie ${layout.toString()}`}</CardTitle>
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
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Pie ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(...d) => CustomChartTooltip(...d, chartConfig)}
                  cursor={false}
                />
              }
            />
            <ChartLegend
              content={<ChartLegendContent />}
              className="flex-wrap"
            />
            <Pie
              endAngle={
                layout === 'halfpie' || layout === 'halfdonut' ? 180 : 360
              }
              data={dataMerged}
              dataKey="count"
              nameKey="name"
              innerRadius={
                layout === 'donut' || layout === 'halfdonut' ? '70%' : 0
              }
              outerRadius="90%"
              paddingAngle={
                layout === 'donut' || layout === 'halfdonut' ? gap : 0
              }
              strokeWidth={
                layout === 'donut' || layout === 'halfdonut' ? 0 : gap
              }
              stroke="hsl(var(--muted))"
              fill="hsl(var(--muted))"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
