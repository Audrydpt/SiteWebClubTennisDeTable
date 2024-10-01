import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"



const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface MultiBarComponentProps {
    layout : "vertical" | "horizontal"
}

export default function MultiBarComponent({layout = "vertical"}: MultiBarComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={chartData}
            layout={layout}
            >
            
            
            {layout == "horizontal" ?
                <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                />
                :
                <>
                    <XAxis type="number" dataKey="desktop" hide />
                    <YAxis
                        dataKey="month"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                    />
                </>
            }

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            {layout == "horizontal" ?
                <>
                    <Bar
                        dataKey="desktop"
                        fill="var(--color-desktop)"
                        radius={[0, 0, 4, 4]}
                    />
                    <Bar
                        dataKey="mobile"
                        fill="var(--color-mobile)"
                        radius={[4, 4, 0, 0]}
                    />
                </>
                :
                <>
                    <Bar
                        dataKey="desktop"
                        fill="var(--color-desktop)"
                        radius={[4, 0, 0, 4]}
                    />
                    <Bar
                        dataKey="mobile"
                        fill="var(--color-mobile)"
                        radius={[0, 4, 4, 0]}
                    />
                </>
            }
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
