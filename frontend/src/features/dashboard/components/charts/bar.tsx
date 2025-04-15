import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  CustomChartTickDate,
  CustomChartTickValue,
  CustomChartTooltip,
} from '@/components/charts';
import {
  AggregationTypeToObject,
  ChartProps,
  GroupByChartProps,
} from '../../lib/props';
import { getTimeFormattingConfig, getWidgetData } from '../../lib/utils';

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

export type BarComponentProps = ChartProps & {
  layout?:
    | 'vertical'
    | 'horizontal'
    | 'vertical stacked'
    | 'horizontal stacked';
};

export default function BarComponent({
  layout = 'horizontal',
  ...props
}: BarComponentProps & GroupByChartProps) {
  const { t, i18n } = useTranslation();
  const { widgetId, title, table, aggregation, duration, where, page } = props;
  const { groupBy } = props;

  const isStacked = layout.includes('stack');
  const baseLayout = layout.includes('horizontal') ? 'horizontal' : 'vertical';
  console.log('BarComponent : WidgetId : ', widgetId);
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

  const translatedCount = t('dashboard:legend.value');
  const { dataMerged, chartConfig } = useMemo(() => {
    if (!data) return { dataMerged: {}, chartConfig: {} };

    return (data as DataType[]).reduce<ProcessedData>(
      (acc, item) => {
        const { timestamp, count } = item;
        const groupValue = groupBy ? item[groupBy] : translatedCount;

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
  }, [translatedCount, data, groupBy]);

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Bar ${layout.toString()}`}</CardTitle>
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

  const lastIndex = Object.keys(chartConfig).length - 1;
  const getBarRadius = (index: number): [number, number, number, number] => {
    if (isStacked) {
      if (index !== lastIndex) return [0, 0, 0, 0];
      return baseLayout === 'horizontal' ? [4, 4, 0, 0] : [0, 4, 4, 0];
    }

    return baseLayout === 'horizontal' ? [8, 8, 0, 0] : [0, 8, 8, 0];
  };

  const Axis1 = baseLayout === 'horizontal' ? XAxis : YAxis;
  const Axis2 = baseLayout === 'horizontal' ? YAxis : XAxis;

  return (
    <Card className="w-full h-full flex flex-col justify-center">
      <CardHeader>
        <CardTitle className="text-left">
          {title ?? `Bar ${layout.toString()}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={Object.values(dataMerged)} layout={baseLayout}>
            <CartesianGrid
              vertical={baseLayout === 'vertical'}
              horizontal={baseLayout === 'horizontal'}
            />

            <Axis1
              dataKey="timestamp"
              type="category"
              tickLine
              axisLine
              tickMargin={8}
              angle={baseLayout === 'horizontal' ? -30 : 0}
              tickFormatter={(v: string) =>
                CustomChartTickDate(i18n.language, v, format)
              }
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
                stackId={isStacked ? 'stack' : undefined}
                fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                radius={getBarRadius(index)}
                unit={table === 'AcicOccupancy' ? '%' : ''}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
