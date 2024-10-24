import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { GetDashboardGroupBy } from '../../lib/api/dashboard';
import { ChartProps } from '../../lib/types/ChartProps';

const chartConfig = {
  positive: {
    label: 'Positive',
  },
  negative: {
    label: 'Negative',
  },
} satisfies ChartConfig;

type MultiBarComponentProps = ChartProps & {
  layout?: 'vertical' | 'horizontal';
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

export default function MultiBarComponent({
  layout = 'vertical',
  ...props
}: MultiBarComponentProps) {
  const { table, aggregation, duration } = props;
  const groupBy = 'direction';

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
          <CardTitle>Area: {layout.toString()}</CardTitle>
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
      {}
    )
  );

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>Multi-Bar {layout.toString()}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={dataMerged} layout={layout}>
            {layout === 'horizontal' ? (
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
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
                  tickFormatter={(value) => value.slice(0, 3)}
                />
              </>
            )}

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            {layout === 'horizontal' ? (
              <>
                <Bar dataKey="positive" fill="hsl(var(--chart-1))" radius={4} />
                <Bar dataKey="negative" fill="hsl(var(--chart-2))" radius={4} />
              </>
            ) : (
              <>
                <Bar dataKey="positive" fill="hsl(var(--chart-1))" radius={4} />
                <Bar dataKey="negative" fill="hsl(var(--chart-2))" radius={4} />
              </>
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
