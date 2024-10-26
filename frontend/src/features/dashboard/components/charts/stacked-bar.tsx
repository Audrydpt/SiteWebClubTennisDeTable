import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { StackOffsetType } from 'recharts/types/util/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { GetDashboardGroupBy } from '../../lib/api/dashboard';
import getTimeFormattingConfig from '../../lib/ChartUtils';
import { GroupByChartProps } from '../../lib/types/ChartProps';

const chartConfig = {
  positive: {
    label: 'Positive',
  },
  negative: {
    label: 'Negative',
  },
} satisfies ChartConfig;

type StackedBarComponentProps = GroupByChartProps & {
  layout?: 'vertical' | 'horizontal';
  stackOffset?: StackOffsetType;
};

interface DataType {
  timestamp: string;
  count: number;
  direction: 'positive' | 'negative';
}
interface MergedDataType {
  timestamp: string;
  positive?: number;
  negative?: number;
}

export default function StackedBarComponent({
  layout = 'vertical',
  stackOffset = 'none',
  ...props
}: StackedBarComponentProps) {
  const { title, table, aggregation, duration } = props;
  const { groupBy } = props;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregation, duration, groupBy],
    queryFn: () =>
      GetDashboardGroupBy(
        {
          table,
          aggregation,
          duration,
        },
        groupBy
      ),
    refetchInterval: 10 * 1000,
  });

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Stacked-Bar ${layout.toString()}`}</CardTitle>
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

  const dataMerged = Object.values(
    (data as DataType[]).reduce(
      (acc: { [key: string]: MergedDataType }, item: DataType) => {
        const { timestamp, count, direction } = item;
        if (!acc[timestamp]) {
          acc[timestamp] = { timestamp };
        }
        acc[timestamp][direction] = (acc[timestamp][direction] || 0) + count;
        return acc;
      },
      {} as { [key: string]: MergedDataType }
    )
  );

  const { format, interval } = getTimeFormattingConfig(
    duration,
    dataMerged.length
  );

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Stacked-Bar ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={dataMerged} layout={layout} stackOffset={stackOffset}>
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
                <XAxis type="number" hide />
                <YAxis
                  dataKey="timestamp"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
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
            {layout === 'horizontal' ? (
              <>
                <Bar
                  dataKey="positive"
                  stackId="a"
                  fill="hsl(var(--chart-1))"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="negative"
                  stackId="a"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                />
              </>
            ) : (
              <>
                <Bar
                  dataKey="positive"
                  stackId="a"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 0, 0, 4]}
                />
                <Bar
                  dataKey="negative"
                  stackId="a"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                />
              </>
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
