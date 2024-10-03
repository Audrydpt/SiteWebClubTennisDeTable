import { ScatterChart, XAxis, YAxis, Tooltip, Rectangle, Scatter } from 'recharts';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"
import { useEffect, useRef, useState } from 'react';

interface DataPoint {
  day: string;
  hour: number;
  value: number;
}
const generateData = () => {
  return days.flatMap((day, dayIndex) =>
    hours.map(hour => ({
      day,
      hour,
      value: Math.floor(Math.random() * 100),
      x: dayIndex,
      y: hour,
    } as DataPoint))
  );
};

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 24 }, (_, i) => i);
const chartData = generateData();

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface CustomizedCellProps {
  x: number;
  y: number;
  value: number;
  width: number;
  height: number;
}

const CustomizedCell = ({x, y, value, width, height}: CustomizedCellProps) => {
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
};

export default function HeatmapComponent() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

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
  const cellWidth = dimensions.width / (7+cellWidthPadding+cellWidthPadding);
  const cellHeightPadding = 1;
  const cellHeight = dimensions.height / (24+cellHeightPadding+cellHeightPadding);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heatmap Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer ref={containerRef} className="h-[400px] w-full p-4" config={chartConfig}>
          
          <ScatterChart
            width={dimensions.width}
            height={dimensions.height}
          >
            <XAxis
              dataKey="x"
              type="number"
              tickLine={false}
              axisLine={false}
              ticks={[0, 1, 2, 3, 4, 5, 6]}
              tickFormatter={(value) => days[value]}
              domain={[0-cellWidthPadding, 6+cellWidthPadding]}
            />
            <YAxis
              dataKey="y"
              type="number"
              tickLine={false}
              axisLine={false}
              domain={[0, 23]}
              ticks={[-cellHeightPadding, 0, 6, 12, 18, 23]}
            />
            <Tooltip
                cursor={false}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const { day, hour, value } = payload[0].payload;
                    return (
                      <div style={{ backgroundColor: 'white', padding: '5px', border: '1px solid #ccc' }}>
                        <p>{`${day}, ${hour}:00`}</p>
                        <p>{`Value: ${value}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
            />
            <Scatter 
              data={chartData} 
              shape={<CustomizedCell width={cellWidth} height={cellHeight} />} 
            />
          </ScatterChart>

        </ChartContainer>
      </CardContent>
    </Card>
  )
}