import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { GetDashboard } from '../lib/api/dashboard';
import { ChartProps } from '../lib/types/ChartProps';

const chartConfig = {
  count: {
    label: 'Count',
  },
} satisfies ChartConfig;

type BarComponentProps = ChartProps & {
  layout?: 'vertical' | 'horizontal';
};

export default function BarComponent({
  layout = 'vertical',
  ...props
}: BarComponentProps) {
  const { table, aggregation, duration } = props;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregation, duration],
    queryFn: () => GetDashboard({ table, aggregation, duration }),
    refetchInterval: 10 * 1000,
  });

  if (isLoading) {
    return <Card>Loading...</Card>;
  }
  if (isError) {
    return <Card>Error</Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data} layout={layout}>
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
                <XAxis type="number" dataKey="count" hide />
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
            <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
