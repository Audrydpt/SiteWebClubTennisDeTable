import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import { ChartProps } from '../../lib/props';
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
  const { title, table, aggregation, duration } = props;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregation, duration],
    queryFn: () => getWidgetData({ table, aggregation, duration }),
    refetchInterval: 10 * 1000,
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

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Bar ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data} layout={layout}>
            {layout === 'horizontal' ? (
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
            ) : (
              <>
                <XAxis type="number" dataKey="count" hide />
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
                  labelFormatter={(value: string) =>
                    DateTime.fromISO(value).toLocaleString(
                      DateTime.DATETIME_MED
                    )
                  }
                />
              }
            />
            <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
