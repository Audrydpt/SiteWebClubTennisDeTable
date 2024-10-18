import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  positive: {
    label: 'Positive',
  },
  negative: {
    label: 'Negative',
  },
} satisfies ChartConfig;

interface StackedBarComponentProps {
  layout?: 'vertical' | 'horizontal';
}

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
  layout,
}: StackedBarComponentProps) {
  const aggregated = '1 day';
  const table = 'AcicCounting';
  const days = 1;
  const groupBy = 'direction';

  const now = new Date();
  const lastDay = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregated, days, groupBy],
    queryFn: () =>
      fetch(
        `${process.env.MAIN_API_URL}/dashboard/${table}?aggregate=${aggregated}&time_from=${lastDay.toISOString()}&time_to=${now.toISOString()}&group_by=${groupBy}`
      ).then((res) => res.json()),
    refetchInterval: 10 * 1000,
  });

  if (isLoading) {
    return <Card>Loading...</Card>;
  }
  if (isError) {
    return <Card>Error</Card>;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
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

StackedBarComponent.defaultProps = {
  layout: 'vertical',
};
