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
import { GetDashboardGroupBy } from '../lib/api/dashboard';
import { ChartProps } from '../lib/types/ChartProps';

const chartConfig = {
  positive: {
    label: 'Positive',
  },
  negative: {
    label: 'Negative',
  },
} satisfies ChartConfig;

type MultiLineComponentProps = ChartProps & {
  type?: CurveType;
  indicator?: 'line' | 'dot' | 'dashed';
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

export default function MultiLineComponent({
  type = 'natural',
  indicator = 'line',
  ...props
}: MultiLineComponentProps) {
  const { aggregated, table } = props;
  const groupBy = 'direction';

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregated, groupBy],
    queryFn: () =>
      GetDashboardGroupBy(
        {
          table,
          aggregated,
          duration: '1 day',
        },
        groupBy
      ),
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
      {}
    )
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Multiple</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            data={dataMerged}
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
              dataKey="positive"
              type={type}
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="negative"
              type={type}
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
