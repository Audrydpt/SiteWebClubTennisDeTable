import { useQuery } from '@tanstack/react-query';
import { Pie, PieChart } from 'recharts';

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
    color: 'hsl(var(--chart-1))',
  },
  negative: {
    label: 'Negative',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

type PieComponentProps = ChartProps & {
  layout?: 'pie' | 'donut' | 'halfpie' | 'halfdonut';
  gap?: number;
};

interface DataType {
  timestamp: string;
  count: number;
  direction: 'positive' | 'negative';
}
interface MergedDataType {
  count: number;
  direction: 'positive' | 'negative';
  fill: string;
}

export default function PieComponent({
  layout = 'pie',
  gap = 0,
  ...props
}: PieComponentProps) {
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

  if (isLoading) {
    return <Card>Loading...</Card>;
  }
  if (isError) {
    return <Card>Error</Card>;
  }

  const dataMerged: MergedDataType[] = Object.values(
    data.reduce(
      (acc: { [key: string]: MergedDataType }, item: DataType) => {
        if (!acc[item.direction]) {
          acc[item.direction] = {
            count: item.count,
            direction: item.direction,
            fill: chartConfig[item.direction].color,
          };
        } else {
          acc[item.direction].count += item.count;
        }
        return acc;
      },
      {} as { [key: string]: MergedDataType }
    )
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Custom Label</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="direction" hideLabel />}
            />
            <Pie
              endAngle={
                layout === 'halfpie' || layout === 'halfdonut' ? 180 : 360
              }
              data={dataMerged}
              dataKey="count"
              labelLine={false}
              nameKey="direction"
              innerRadius={
                layout === 'donut' || layout === 'halfdonut' ? 60 : 0
              }
              outerRadius={80}
              paddingAngle={
                layout === 'donut' || layout === 'halfdonut' ? gap : 0
              }
              strokeWidth={
                layout === 'donut' || layout === 'halfdonut' ? 0 : gap
              }
              stroke="hsl(var(--muted))"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
