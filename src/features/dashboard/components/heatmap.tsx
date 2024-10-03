import { useEffect, useRef, useState } from 'react';
import { Rectangle, Scatter, ScatterChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface DataPoint {
  day: string;
  hour: number;
  value: number;
}

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 24 }, (_, i) => i);
const generateData = () =>
  days.flatMap((day, dayIndex) =>
    hours.map((hour) => ({
      day,
      hour,
      value: Math.floor(Math.random() * 100),
      x: dayIndex,
      y: hour,
    }))
  );

const chartData = generateData();

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface CustomizedCellProps {
  // eslint-disable-next-line react/require-default-props
  x?: number;
  // eslint-disable-next-line react/require-default-props
  y?: number;
  // eslint-disable-next-line react/require-default-props
  value?: number;
  width: number;
  height: number;
}

function CustomizedCell({ x, y, value, width, height }: CustomizedCellProps) {
  if (x === undefined || y === undefined || value === undefined) return null;

  const opacity = value / 100;
  return (
    <Rectangle
      x={x - width / 2}
      y={y}
      width={width}
      height={height}
      fill={`rgba(57, 147, 158, ${opacity})`}
      stroke="#fff"
    />
  );
}

const labelFormatter = (_value: unknown, name: Array<{ value: number }>) => {
  const x = name[0].value;
  const y = name[1].value;
  return `${days[x]} ${y}:00`;
};
const formatter = (
  _value: string | number | Array<string | number>,
  _name: string,
  props: { payload: DataPoint },
  index: number
) => {
  if (index === 0) return props.payload.value;
  return null;
};

export default function HeatmapComponent() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updateDimensions = () => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const cellWidthPadding = 0.5;
  const cellWidth = Math.floor(dimensions.width / (7 + 2 * cellWidthPadding));
  const cellHeightPadding = 1;
  const cellHeight =
    Math.floor(dimensions.height / (24 + cellHeightPadding)) - 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heatmap Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          ref={containerRef}
          className="h-[400px] w-full p-4"
          config={chartConfig}
        >
          <ScatterChart width={dimensions.width} height={dimensions.height}>
            <XAxis
              dataKey="x"
              type="number"
              tickLine={false}
              axisLine={false}
              ticks={[0, 1, 2, 3, 4, 5, 6]}
              tickFormatter={(value) => days[value]}
              domain={[0 - cellWidthPadding, 6 + cellWidthPadding]}
            />
            <YAxis
              dataKey="y"
              type="number"
              tickLine={false}
              axisLine={false}
              domain={[0, 23]}
              ticks={[-cellHeightPadding, 0, 6, 12, 18, 23]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  cursor={false}
                  labelFormatter={labelFormatter as never}
                  formatter={formatter as never}
                />
              }
            />
            <Scatter
              data={chartData}
              shape={<CustomizedCell width={cellWidth} height={cellHeight} />}
            />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
HeatmapComponent.defaultProps = {};
