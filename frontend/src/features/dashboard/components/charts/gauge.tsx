import { useQuery } from '@tanstack/react-query';
import { Duration } from 'luxon';
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import { AggregationTypeToObject, ChartProps } from '../../lib/props';
import { getWidgetData } from '../../lib/utils';

const chartConfig = {
  count: {
    label: 'Count',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface CustomLabelProps {
  value: string | number;
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
}
interface MergedDataType {
  count: number;
  value: number;
}

export default function GaugeComponent({
  layout = 'full',
  ...props
}: GaugeComponentProps) {
  const { title, table, aggregation, duration } = props;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregation, duration],
    queryFn: () => getWidgetData({ table, aggregation, duration }),
    refetchInterval: Duration.fromObject(
      AggregationTypeToObject[aggregation]
    ).as('milliseconds'),
  });

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Gauge ${layout.toString()}`}</CardTitle>
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
      const { count } = item;
      acc.count = (acc.count || 0) + count;
      return acc;
    }, {} as MergedDataType),
  ];

  const maxValue =
    Math.max(...data.map((item: DataType) => item.count)) * data.length;
  dataMerged[0].value =
    (dataMerged[0].count / maxValue) * (layout === 'full' ? 360 : 180);

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Gauge ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadialBarChart
            data={dataMerged}
            innerRadius={60}
            outerRadius={140}
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
