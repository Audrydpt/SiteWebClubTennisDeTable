import { useQuery } from '@tanstack/react-query';
import { Duration } from 'luxon';
import { useMemo } from 'react';
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import { AggregationTypeToObject, ChartProps } from '../../lib/props';
import { getWidgetData } from '../../lib/utils';

const chartConfig = {
  count: {
    label: 'Count',
    color: 'var(--chart-1)',
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
  const { widgetId, title, table, aggregation, duration, where, page } = props;
  const { isLoading, isError, data } = useQuery({
    queryKey: [widgetId, table, aggregation, duration, where, page],
    queryFn: () =>
      getWidgetData(
        { widgetId, table, aggregation, duration, where },
        undefined,
        page
      ),
    refetchInterval: Duration.fromObject(
      AggregationTypeToObject[aggregation]
    ).as('milliseconds'),
  });

  const dataMerged = useMemo(() => {
    if (!data) return [{ count: 0, value: 0 }];

    const merged = [
      data.reduce((acc: MergedDataType, item: DataType) => {
        const { count } = item;
        acc.count = (acc.count || 0) + count;
        return acc;
      }, {} as MergedDataType),
    ];

    const maxValue =
      Math.max(...data.map((item: DataType) => item.count)) * data.length;
    merged[0].value =
      (merged[0].count / maxValue) * (layout === 'full' ? 360 : 180);

    return merged;
  }, [data, layout]);

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader className="w-full">
          <CardTitle className="text-center">
            {title ?? `Gauge ${layout.toString()}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="grow w-full">
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

  const maxValue =
    Math.max(...data.map((item: DataType) => item.count)) * data.length;
  dataMerged[0].value =
    (dataMerged[0].count / maxValue) * (layout === 'full' ? 360 : 180);

  return (
    <Card className="w-full h-full flex flex-col justify-center">
      <CardHeader className="w-full">
        <CardTitle className="text-center">
          {title ?? `Gauge ${layout.toString()}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="grow w-full">
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
              fill="var(--chart-1)"
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
