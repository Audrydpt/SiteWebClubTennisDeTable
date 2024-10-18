import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { CurveType } from 'recharts/types/shape/Curve';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  count: {
    label: 'Count',
  },
} satisfies ChartConfig;

interface AreaComponentProps {
  type?: CurveType;
  indicator?: 'line' | 'dot' | 'dashed';
}

export default function AreaComponent({ type, indicator }: AreaComponentProps) {
  const aggregated = '1 hour';
  const table = 'AcicCounting';
  const days = 1.0;

  const now = new Date();
  const lastDay = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregated, days],
    queryFn: () =>
      fetch(
        `${process.env.MAIN_API_URL}/dashboard/${table}?aggregate=${aggregated}&time_from=${lastDay.toISOString()}&time_to=${now.toISOString()}`
      ).then((res) => res.json()),
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
        <CardTitle>Area Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
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
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator={indicator} />}
            />
            <Area
              dataKey="count"
              type={type}
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

AreaComponent.defaultProps = {
  type: 'natural',
  indicator: 'line',
};
