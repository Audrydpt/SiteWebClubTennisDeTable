import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CurveType } from 'recharts/types/shape/Curve';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import {
  CustomChartTickDate,
  CustomChartTickValue,
  CustomChartTooltip,
} from '@/components/charts';
import { AggregationTypeToObject, ChartProps } from '../../lib/props';
import { getTimeFormattingConfig, getWidgetData } from '../../lib/utils';

const chartConfig = {
  count: {
    label: 'Count',
  },
} satisfies ChartConfig;

type AreaComponentProps = ChartProps & {
  layout?: CurveType;
};

export default function AreaComponent({
  layout = 'basis',
  ...props
}: AreaComponentProps) {
  const { title, table, aggregation, duration, where } = props;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregation, duration, where],
    queryFn: () => getWidgetData({ table, aggregation, duration, where }),
    refetchInterval: Duration.fromObject(
      AggregationTypeToObject[aggregation]
    ).as('milliseconds'),
  });

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Area ${layout.toString()}`}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
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
    data.length,
    data.size
  );

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Area ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
            data={data}
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
                CustomChartTickDate(t, format, aggregation)
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
                  formatter={CustomChartTooltip}
                  labelFormatter={(value: string) =>
                    DateTime.fromISO(value).toLocaleString(
                      DateTime.DATETIME_MED
                    )
                  }
                />
              }
            />
            <Area
              dataKey="count"
              type={layout}
              unit={table === 'AcicOccupancy' ? '%' : ''}
              fill="hsl(var(--chart-1))"
              fillOpacity={0.4}
              stroke="hsl(var(--chart-1))"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
