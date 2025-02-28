import AreaComponent from '../components/charts/area';
import BarComponent from '../components/charts/bar';
import GaugeComponent from '../components/charts/gauge';
import HeatmapComponent from '../components/charts/heatmap';
import LineComponent from '../components/charts/line';
import MultiGaugeComponent from '../components/charts/multi-gauge';
import PieComponent from '../components/charts/pie';
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
  [ChartType.MultiGauge]: MultiGaugeComponent,
  [ChartType.StackedGauge]: StackedGaugeComponent,
  [ChartType.Heatmap]: HeatmapComponent,
} as ChartComponentsType;

type StackedOptionsType = {
  [K in ChartType]: boolean;
};
export const StackedOptions = {
  [ChartType.Area]: true,
  [ChartType.Line]: true,
  [ChartType.Bar]: true,
  [ChartType.Gauge]: false,
  [ChartType.Pie]: true,
  [ChartType.MultiGauge]: true,
  [ChartType.StackedGauge]: true,
  [ChartType.Heatmap]: false,
} as StackedOptionsType;

export const UniqueValuesOptions = {
  [ChartType.Area]: false,
  [ChartType.Line]: false,
  [ChartType.Bar]: false,
  [ChartType.Gauge]: true,
  [ChartType.Pie]: true,
  [ChartType.MultiGauge]: false,
  [ChartType.StackedGauge]: true,
  [ChartType.Heatmap]: false,
} as StackedOptionsType;

export const ExperimentalChartType = {
  [ChartType.Area]: false,
  [ChartType.Line]: false,
  [ChartType.Bar]: false,
  [ChartType.Gauge]: true,
  [ChartType.Pie]: false,
  [ChartType.MultiGauge]: false,
  [ChartType.StackedGauge]: true,
  [ChartType.Heatmap]: false,
} as StackedOptionsType;

const ALLOWED_CURVE_TYPES = ['monotone', 'bump', 'linear', 'step'] as const;
const ALLOWED_LAYOUT_TYPES = [
  'horizontal stacked',
  'horizontal sided',
  'vertical stacked',
  'vertical sided',
] as const;
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
  [ChartType.MultiGauge]: ALLOWED_GAUGE_TYPES,
  [ChartType.StackedGauge]: ALLOWED_GAUGE_TYPES,
  [ChartType.Heatmap]: ALLOWED_LAYOUT_TYPES,
} as LayoutOptionsType;
