import AreaComponent from './components/area';
import BarComponent from './components/bar';
import GaugeComponent from './components/gauge';
import HeatmapComponent from './components/heatmap';
import LineComponent from './components/line';
import MultiBarComponent from './components/multi-bar';
import MultiGaugeComponent from './components/multi-gauge';
import MultiLineComponent from './components/multi-line';
import PieComponent from './components/pie';
import StackedAreaComponent from './components/stacked-area';
import StackedBarComponent from './components/stacked-bar';
import StackedGaugeComponent from './components/stacked-gauge';

export default function Charts() {
  return (
    <>
      <h2 className="w-full">Preview:</h2>
      <div className="w-full grid grid-cols-3 gap-2">
        <AreaComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          type="natural"
        />
        <AreaComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          type="linear"
        />
        <AreaComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          type="step"
        />
        <LineComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          type="natural"
        />
        <LineComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          type="linear"
        />
        <LineComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          type="step"
        />
        <StackedAreaComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="natural"
          stackOffset="none"
        />
        <StackedAreaComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="natural"
          stackOffset="expand"
        />
        <StackedAreaComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="natural"
          stackOffset="wiggle"
        />
        <MultiLineComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          type="natural"
        />
        <MultiLineComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          type="linear"
        />
        <MultiLineComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          type="step"
        />
        <BarComponent
          table="AcicCounting"
          duration="1 week"
          aggregation="1 day"
          layout="horizontal"
        />
        <StackedBarComponent
          table="AcicCounting"
          duration="1 week"
          aggregation="1 day"
          layout="horizontal"
        />
        <MultiBarComponent
          table="AcicCounting"
          duration="1 week"
          aggregation="1 day"
          layout="horizontal"
        />
        <BarComponent
          table="AcicCounting"
          duration="1 week"
          aggregation="1 day"
          layout="vertical"
        />
        <StackedBarComponent
          table="AcicCounting"
          duration="1 week"
          aggregation="1 day"
          layout="vertical"
        />
        <MultiBarComponent
          table="AcicCounting"
          duration="1 week"
          aggregation="1 day"
          layout="vertical"
        />
        <PieComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="donut"
          gap={0}
        />
        <PieComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="pie"
          gap={1}
        />
        <PieComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="donut"
          gap={4}
        />
        <PieComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="halfdonut"
          gap={0}
        />
        <PieComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="halfpie"
          gap={1}
        />
        <PieComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="halfdonut"
          gap={4}
        />
        <GaugeComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="half"
        />
        <GaugeComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="full"
        />
        <MultiGaugeComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="full"
        />
        <MultiGaugeComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="half"
        />
        <StackedGaugeComponent
          table="AcicCounting"
          duration="1 day"
          aggregation="1 hour"
          layout="half"
        />
        <HeatmapComponent className="col-span-3" />
      </div>
    </>
  );
}
