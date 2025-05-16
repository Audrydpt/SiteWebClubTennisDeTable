import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { CurveType } from 'recharts/types/shape/Curve';

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
import { AggregationTypeToObject, GroupByChartProps } from '../../lib/props';
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

export default function LineComponent({
  layout = 'natural',
  ...props
}: MultiLineComponentProps & GroupByChartProps) {
  const { t, i18n } = useTranslation();
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
          <CardTitle>{title ?? `Line ${layout.toString()}`}</CardTitle>
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
  console.log('Line component : dataMerged = ', dataMerged);
  const trendStats = props.trendData;
  const chartData = Object.values(dataMerged);
  console.log('Line component : chartData = ', chartData);

  const getStatForBucket = (bucket: number) => {
    if (Array.isArray(trendStats)) {
      return trendStats.find((s) => s.bucket === bucket);
    }
    return undefined;
  };

  const makeStatLine = (statKey: 'avg' | 'min' | 'max' | 'std') =>
    chartData.map((d) => {
      const bucket = DateTime.fromISO(d.timestamp).weekday;
      const stat = getStatForBucket(bucket);
      return { timestamp: d.timestamp, value: stat?.[statKey] };
    });

  const avgLine = trendStats ? makeStatLine('avg') : [];
  const minLine = trendStats ? makeStatLine('min') : [];
  const maxLine = trendStats ? makeStatLine('max') : [];
  const stdLine = trendStats ? makeStatLine('std') : [];

  return (
    <Card className="w-full h-full flex flex-col justify-center">
      <CardHeader>
        <CardTitle className="text-center">
          {title ?? `Line ${layout.toString()}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine
              axisLine
              tickMargin={8}
              angle={-30}
              tickFormatter={(v: string) =>
                CustomChartTickDate(i18n.language, v, format)
              }
              interval={interval}
            />
            <YAxis
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
              <Line
                key={group}
                dataKey={String(group)}
                type={layout}
                stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                strokeWidth={2}
                dot={false}
                unit={table === 'AcicOccupancy' ? '%' : ''}
              />
            ))}

            {trendStats && console.log('Line component : data = ', trendStats)}
            {avgLine.length > 0 && (
              <Line
                data={avgLine}
                dataKey="value"
                stroke="blue"
                strokeDasharray="5 5"
                dot={false}
                name="Moyenne"
                isAnimationActive={false}
              />
            )}
            {minLine.length > 0 && (
              <Line
                data={minLine}
                dataKey="value"
                stroke="green"
                strokeDasharray="2 2"
                dot={false}
                name="Min"
                isAnimationActive={false}
              />
            )}
            {maxLine.length > 0 && (
              <Line
                data={maxLine}
                dataKey="value"
                stroke="red"
                strokeDasharray="2 2"
                dot={false}
                name="Max"
                isAnimationActive={false}
              />
            )}
            {stdLine.length > 0 && (
              <Line
                data={stdLine}
                dataKey="value"
                stroke="orange"
                strokeDasharray="1 1"
                dot={false}
                name="Écart-type"
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
