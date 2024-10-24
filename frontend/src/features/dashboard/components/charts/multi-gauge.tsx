import { useQuery } from '@tanstack/react-query';
import { RadialBar, RadialBarChart } from 'recharts';

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

type MultiGaugeComponentProps = ChartProps & {
  layout?: 'full' | 'half';
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

export default function MultiGaugeComponent({
  layout = 'full',
  ...props
}: MultiGaugeComponentProps) {
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
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>Multi-Gauge {layout.toString()}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadialBarChart
            data={dataMerged}
            innerRadius={30}
            outerRadius={110}
            endAngle={layout === 'full' ? 360 : 180}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="direction" />}
            />
            <RadialBar dataKey="count" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
