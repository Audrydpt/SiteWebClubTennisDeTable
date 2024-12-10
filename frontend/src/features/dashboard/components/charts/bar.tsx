import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import CustomChartTooltip from '@/components/charts';
import { AggregationTypeToObject, ChartProps } from '../../lib/props';
import { getTimeFormattingConfig, getWidgetData } from '../../lib/utils';

const chartConfig = {
  count: {
    label: 'Count',
  },
} satisfies ChartConfig;

type BarComponentProps = ChartProps & {
  layout?: 'vertical' | 'horizontal';
};

export default function BarComponent({
  layout = 'horizontal',
  ...props
}: BarComponentProps) {
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
          <CardTitle>{title ?? `Bar ${layout.toString()}`}</CardTitle>
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

  const getBarRadius = (): [number, number, number, number] =>
    layout === 'horizontal' ? [8, 8, 0, 0] : [0, 8, 8, 0];

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Bar ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data} layout={layout}>
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
                  tickMargin={8}
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
                  formatter={CustomChartTooltip}
                  labelFormatter={(value: string) =>
                    DateTime.fromISO(value).toLocaleString(
                      DateTime.DATETIME_MED
                    )
                  }
                />
              }
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--chart-1))"
              radius={getBarRadius()}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
