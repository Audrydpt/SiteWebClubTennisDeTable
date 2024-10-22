import { useQuery } from '@tanstack/react-query';
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { GetDashboardGroupBy } from '../lib/api/dashboard';
import { ChartProps } from '../lib/types/ChartProps';

const chartConfig = {
  count: {
    label: 'Count',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface CustomLabelProps {
  value: number;
  viewBox?: {
    cx: number;
    cy: number;
  };
}
function CustomLabel({ value, viewBox }: CustomLabelProps) {
  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
    return (
      <text
        x={viewBox.cx}
        y={viewBox.cy}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x={viewBox.cx}
          y={viewBox.cy}
          className="fill-foreground text-4xl font-bold"
        >
          {value}
        </tspan>
        <tspan
          x={viewBox.cx}
          y={(viewBox.cy || 0) + 24}
          className="fill-muted-foreground"
        />
      </text>
    );
  }
  return null;
}

type GaugeComponentProps = ChartProps & {
  layout?: 'full' | 'half';
};

interface DataType {
  timestamp: string;
  count: number;
  direction: 'positive' | 'negative';
}
interface MergedDataType {
  count: number;
  value: number;
}

export default function GaugeComponent({
  layout = 'full',
  ...props
}: GaugeComponentProps) {
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

  const dataMerged: MergedDataType[] = [
    data.reduce((acc: MergedDataType, item: DataType) => {
      const { count } = item;
      acc.count = (acc.count || 0) + count;
      return acc;
    }, {} as MergedDataType),
  ];
  const maxValue = 30000;
  dataMerged[0].value =
    (dataMerged[0].count / maxValue) * (layout === 'full' ? 360 : 180);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart Gauge</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={dataMerged}
            innerRadius={80}
            outerRadius={160}
            endAngle={layout === 'full' ? 360 : 180}
          >
            <RadialBar
              dataKey="payload"
              data={[{ payload: layout === 'full' ? 360 : 180 }]}
              fill="none"
            />
            <RadialBar
              dataKey="value"
              fill="hsl(var(--chart-1))"
              background
              cornerRadius={10}
            />

            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label content={<CustomLabel value={dataMerged[0].count} />} />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
