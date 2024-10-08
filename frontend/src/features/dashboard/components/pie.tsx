import { Pie, PieChart } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 187, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 90, fill: 'var(--color-other)' },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Chrome',
    color: 'hsl(var(--chart-1))',
  },
  safari: {
    label: 'Safari',
    color: 'hsl(var(--chart-2))',
  },
  firefox: {
    label: 'Firefox',
    color: 'hsl(var(--chart-3))',
  },
  edge: {
    label: 'Edge',
    color: 'hsl(var(--chart-4))',
  },
  other: {
    label: 'Other',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

interface PieComponentProps {
  layout?: 'pie' | 'donut' | 'halfpie' | 'halfdonut';
  gap?: number;
}

export default function PieComponent({ layout, gap }: PieComponentProps) {
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
              content={<ChartTooltipContent nameKey="visitors" hideLabel />}
            />
            <Pie
              endAngle={
                layout === 'halfpie' || layout === 'halfdonut' ? 180 : 360
              }
              data={chartData}
              dataKey="visitors"
              labelLine={false}
              nameKey="browser"
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
PieComponent.defaultProps = {
  layout: 'pie',
  gap: 0,
};
