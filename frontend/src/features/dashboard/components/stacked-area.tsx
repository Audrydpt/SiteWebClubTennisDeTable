import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { CurveType } from 'recharts/types/shape/Curve';
import { StackOffsetType } from 'recharts/types/util/types';

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

interface StackedAreaComponentProps {
  layout?: CurveType;
  indicator?: 'line' | 'dot' | 'dashed';
  stackOffset?: StackOffsetType;
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

export default function StackedAreaComponent({
  layout,
  indicator,
  stackOffset,
}: StackedAreaComponentProps) {
  const server = 'http://192.168.20.145:5000';
  const aggregated = '1 hour';
  const table = 'AcicCounting';
  const days = 1;
  const groupBy = 'direction';

  const now = new Date();
  const lastDay = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const { isLoading, data } = useQuery({
    queryKey: [server, table, aggregated, days, groupBy],
    queryFn: () =>
      fetch(
        `${server}/dashboard/${table}?aggregate=${aggregated}&time_from=${lastDay.toISOString()}&time_to=${now.toISOString()}&group_by=${groupBy}`
      ).then((res) => res.json()),
    refetchInterval: 10 * 1000,
  });

  if (isLoading) {
    return <Card>Loading...</Card>;
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
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Stacked</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={dataMerged}
            margin={{
              left: 12,
              right: 12,
            }}
            stackOffset={stackOffset}
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
              dataKey="positive"
              type={layout}
              fill="hsl(var(--chart-1))"
              fillOpacity={0.4}
              stroke="hsl(var(--chart-1))"
              stackId="a"
            />
            <Area
              dataKey="negative"
              type={layout}
              fill="hsl(var(--chart-2))"
              fillOpacity={0.4}
              stroke="hsl(var(--chart-2))"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

StackedAreaComponent.defaultProps = {
  layout: 'natural',
  indicator: 'line',
  stackOffset: 'none',
};
