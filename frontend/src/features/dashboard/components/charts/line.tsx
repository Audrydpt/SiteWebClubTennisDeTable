/* eslint-disable @stylistic/indent */
import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
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

  const { format, interval } = getTimeFormattingConfig(
    duration,
    Object.keys(dataMerged).length,
    data?.size
  );

  const trendStats = props.trendData;

  // Enhanced chartData with stats integrated into each point
  const chartData = useMemo(() => {
    const baseData = Object.values(dataMerged);

    // If no trend stats, just return the original data
    if (!trendStats || !Array.isArray(trendStats)) {
      return baseData;
    }

    // Add stat properties to each data point
    return baseData.map((dataPoint) => {
      let bucket;
      switch (aggregation) {
        case '1 minute':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).minute;
          break;
        case '15 minutes':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).minute;
          break;
        case '30 minutes':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).minute;
          break;
        case '1 hour':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).hour;
          break;
        case '1 day':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).weekday;
          break;
        case '1 month':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).month;
          break;
        case '1 week':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).weekNumber;
          break;
        case '3 months':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).month;
          break;
        case '6 months':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).month;
          break;
        case '1 year':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).year;
          break;
        case '100 years':
          bucket = DateTime.fromISO(dataPoint.timestamp as string).year;
          break;
        default:
          bucket = DateTime.fromISO(dataPoint.timestamp as string).weekday;
          break;
      }

      const stat = trendStats.find((s) => s.bucket === bucket);
      const valeurAsNumber = Number(stat?.avg || 0);

      return {
        ...dataPoint,
        avg: stat?.avg,
        min: stat?.min,
        max: stat?.max,
        std: [
          valeurAsNumber - (stat?.std || 0),
          valeurAsNumber + (stat?.std || 0),
        ],
      };
    });
  }, [dataMerged, trendStats, aggregation]);

  // Enhanced chart config with stat lines
  const enhancedChartConfig = useMemo(() => {
    const config = { ...chartConfig };

    if (trendStats && Array.isArray(trendStats)) {
      config.avg = { label: 'Moyenne' };
      config.min = { label: 'Min' };
      config.max = { label: 'Max' };
      config.std = { label: 'Écart-type' };
    }

    return config;
  }, [chartConfig, trendStats]);

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader className="w-full">
          <CardTitle className="text-center">
            {title ?? `Line ${layout.toString()}`}
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
    <Card className="w-full h-full flex flex-col justify-center">
      <CardHeader className="w-full">
        <CardTitle className="text-center">
          {title ?? `Line ${layout.toString()}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="grow w-full">
        <ChartContainer config={enhancedChartConfig} className="h-full w-full">
          <ComposedChart
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
                  formatter={(...d) =>
                    CustomChartTooltip(...d, enhancedChartConfig)
                  }
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
                stroke={`var(--chart-${(index % 5) + 1})`}
                strokeWidth={2}
                dot={false}
                unit={table === 'AcicOccupancy' ? '%' : ''}
              />
            ))}

            {trendStats &&
              Array.isArray(trendStats) &&
              trendStats.length > 0 && [
                <Line
                  key="avg"
                  dataKey="avg"
                  type="linear"
                  stroke="blue"
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />,
                <Line
                  key="min"
                  dataKey="min"
                  type="linear"
                  stroke="green"
                  strokeDasharray="2 2"
                  dot={false}
                  isAnimationActive={false}
                />,
                <Line
                  key="max"
                  dataKey="max"
                  type="linear"
                  stroke="red"
                  strokeDasharray="2 2"
                  dot={false}
                  isAnimationActive={false}
                />,
                <Area
                  key="std"
                  type="monotone"
                  dataKey="std"
                  stroke="orange"
                  fill="orange"
                  strokeDasharray="1 1"
                  dot={false}
                  isAnimationActive={false}
                  fillOpacity={0.2}
                />,
              ]}
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
