import { useQuery } from '@tanstack/react-query';
import { RadialBar, RadialBarChart } from 'recharts';
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
import { ChartProps } from '../../lib/types/ChartProps';

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

type StackedGaugeComponentProps = ChartProps & {
  layout?: 'full' | 'half';
  stackOffset?: StackOffsetType;
};

interface DataType {
  timestamp: string;
  count: number;
  direction: 'positive' | 'negative';
}
interface MergedDataType {
  positive: number;
  negative: number;
}

export default function StackedGaugeComponent({
  layout = 'full',
  stackOffset = 'none',
  ...props
}: StackedGaugeComponentProps) {
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

  const dataMerged: MergedDataType[] = [
    data.reduce((acc: MergedDataType, item: DataType) => {
      const { count, direction } = item;
      acc[direction] = (acc[direction] || 0) + count;
      return acc;
    }, {} as MergedDataType),
  ];

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader className="items-center pb-0">
        <CardTitle>Stacked-Gauge {layout.toString()}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadialBarChart
            data={dataMerged}
            innerRadius={80}
            outerRadius={120}
            endAngle={layout === 'full' ? 360 : 180}
            stackOffset={stackOffset}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="direction" />}
            />
            <RadialBar
              dataKey="positive"
              stackId="a"
              cornerRadius={5}
              fill="hsl(var(--chart-1))"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="negative"
              fill="hsl(var(--chart-2))"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
