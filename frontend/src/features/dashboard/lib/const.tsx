import AreaComponent from '../components/charts/area';
import BarComponent from '../components/charts/bar';
import GaugeComponent from '../components/charts/gauge';
import HeatmapComponent from '../components/charts/heatmap';
import LineComponent from '../components/charts/line';
import MultiBarComponent from '../components/charts/multi-bar';
import MultiGaugeComponent from '../components/charts/multi-gauge';
import MultiLineComponent from '../components/charts/multi-line';
import PieComponent from '../components/charts/pie';
import StackedAreaComponent from '../components/charts/stacked-area';
import StackedBarComponent from '../components/charts/stacked-bar';
import StackedGaugeComponent from '../components/charts/stacked-gauge';
import { ChartProps, ChartType, GroupByChartProps } from './props';

type ChartComponentsType = {
  [K in ChartType]: React.ComponentType<ChartProps | GroupByChartProps>;
};
export const ChartTypeComponents = {
  [ChartType.Area]: AreaComponent,
  [ChartType.Bar]: BarComponent,
  [ChartType.Line]: LineComponent,
  [ChartType.Gauge]: GaugeComponent,
  [ChartType.Pie]: PieComponent,
  [ChartType.MultiBar]: MultiBarComponent,
  [ChartType.MultiLine]: MultiLineComponent,
  [ChartType.MultiGauge]: MultiGaugeComponent,
  [ChartType.StackedArea]: StackedAreaComponent,
  [ChartType.StackedBar]: StackedBarComponent,
  [ChartType.StackedGauge]: StackedGaugeComponent,
  [ChartType.Heatmap]: HeatmapComponent,
} as ChartComponentsType;

type StackedOptionsType = {
  [K in ChartType]: boolean;
};
export const StackedOptions = {
  [ChartType.Area]: false,
  [ChartType.Line]: false,
  [ChartType.Bar]: false,
  [ChartType.Gauge]: false,
  [ChartType.Pie]: true,
  [ChartType.MultiBar]: true,
  [ChartType.MultiLine]: true,
  [ChartType.MultiGauge]: true,
  [ChartType.StackedArea]: true,
  [ChartType.StackedBar]: true,
  [ChartType.StackedGauge]: true,
  [ChartType.Heatmap]: false,
} as StackedOptionsType;

export const UniqueValuesOptions = {
  [ChartType.Area]: false,
  [ChartType.Line]: false,
  [ChartType.Bar]: false,
  [ChartType.Gauge]: true,
  [ChartType.Pie]: true,
  [ChartType.MultiBar]: false,
  [ChartType.MultiLine]: false,
  [ChartType.MultiGauge]: false,
  [ChartType.StackedArea]: false,
  [ChartType.StackedBar]: false,
  [ChartType.StackedGauge]: true,
  [ChartType.Heatmap]: false,
} as StackedOptionsType;

export const ExperimentalChartType = {
  [ChartType.Area]: false,
  [ChartType.Line]: false,
  [ChartType.Bar]: false,
  [ChartType.Gauge]: true,
  [ChartType.Pie]: false,
  [ChartType.MultiBar]: false,
  [ChartType.MultiLine]: false,
  [ChartType.MultiGauge]: false,
  [ChartType.StackedArea]: false,
  [ChartType.StackedBar]: false,
  [ChartType.StackedGauge]: true,
  [ChartType.Heatmap]: false,
} as StackedOptionsType;

const ALLOWED_CURVE_TYPES = ['monotone', 'bump', 'linear', 'step'] as const;
const ALLOWED_LAYOUT_TYPES = ['horizontal', 'vertical'] as const;
const ALLOWED_GAUGE_TYPES = ['half', 'full'] as const;
const ALLOWED_PIE_TYPES = ['pie', 'donut', 'halfpie', 'halfdonut'] as const;

type LayoutOptionsType = {
  [K in ChartType]: readonly string[];
};
export const LayoutOptions = {
  [ChartType.Area]: ALLOWED_CURVE_TYPES,
  [ChartType.Bar]: ALLOWED_LAYOUT_TYPES,
  [ChartType.Line]: ALLOWED_CURVE_TYPES,
  [ChartType.Gauge]: ALLOWED_GAUGE_TYPES,
  [ChartType.Pie]: ALLOWED_PIE_TYPES,
  [ChartType.MultiBar]: ALLOWED_LAYOUT_TYPES,
  [ChartType.MultiLine]: ALLOWED_CURVE_TYPES,
  [ChartType.MultiGauge]: ALLOWED_GAUGE_TYPES,
  [ChartType.StackedArea]: ALLOWED_CURVE_TYPES,
  [ChartType.StackedBar]: ALLOWED_LAYOUT_TYPES,
  [ChartType.StackedGauge]: ALLOWED_GAUGE_TYPES,
  [ChartType.Heatmap]: ALLOWED_LAYOUT_TYPES,
} as LayoutOptionsType;
