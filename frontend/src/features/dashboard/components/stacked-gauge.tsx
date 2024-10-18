import { useQuery } from '@tanstack/react-query';
import { RadialBar, RadialBarChart } from 'recharts';

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
    color: 'hsl(var(--chart-1))',
  },
  negative: {
    label: 'Negative',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

interface StackedGaugeComponentProps {
  layout?: 'full' | 'half';
}

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
  layout,
}: StackedGaugeComponentProps) {
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

  const dataMerged: MergedDataType[] = [
    data.reduce((acc: MergedDataType, item: DataType) => {
      const { count, direction } = item;
      acc[direction] = (acc[direction] || 0) + count;
      return acc;
    }, {} as MergedDataType),
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={dataMerged}
            innerRadius={80}
            outerRadius={120}
            endAngle={layout === 'full' ? 360 : 180}
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

StackedGaugeComponent.defaultProps = {
  layout: 'full',
};
