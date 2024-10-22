import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { CurveType } from 'recharts/types/shape/Curve';

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

type LineComponentProps = ChartProps & {
  type?: CurveType;
  indicator?: 'line' | 'dot' | 'dashed';
};

export default function LineComponent({
  type = 'natural',
  indicator = 'line',
  ...props
}: LineComponentProps) {
  const { aggregated, table } = props;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregated],
    queryFn: () => GetDashboard({ table, aggregated, duration: '1 day' }),
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
          <LineChart
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
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator={indicator} />}
            />
            <Line
              dataKey="count"
              type={type}
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
