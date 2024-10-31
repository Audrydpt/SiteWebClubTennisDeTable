export enum AcicAggregation {
  OneMinute = '1 minute',
  FifteenMinutes = '15 minutes',
  ThirtyMinutes = '30 minutes',
  OneHour = '1 hour',
  OneDay = '1 day',
  OneWeek = '1 week',
  OneMonth = '1 month',
  SixMonths = '6 months',
  OneYear = '1 year',
  LifeTime = '100 years',
}

type AggregationToObject = {
  [K in AcicAggregation]: object;
};

export const AggregationTypeToObject: AggregationToObject = {
  '1 minute': { minutes: 1 },
  '15 minutes': { minutes: 15 },
  '30 minutes': { minutes: 30 },
  '1 hour': { hours: 1 },
  '1 day': { days: 1 },
  '1 week': { weeks: 1 },
  '1 month': { months: 1 },
  '6 months': { months: 6 },
  '1 year': { years: 1 },
  '100 years': { years: 100 },
};

export enum AcicEvent {
  AcicUnattendedItem = 'AcicUnattendedItem',
  AcicCounting = 'AcicCounting',
  AcicNumbering = 'AcicNumbering',
  AcicOccupancy = 'AcicOccupancy',
  AcicLicensePlate = 'AcicLicensePlate',
  AcicOCR = 'AcicOCR',
  AcicAllInOneEvent = 'AcicAllInOneEvent',
  AcicBaseEvent = 'AcicEvent',
}

export enum ChartSize {
  tiny = 'tiny',
  small = 'small',
  medium = 'medium',
  large = 'large',
  big = 'big',
  full = 'full',
}

export enum ChartType {
  Area = 'Area',
  Bar = 'Bar',
  Line = 'Line',
  Gauge = 'Gauge',
  Pie = 'Pie',
  MultiBar = 'MultiBar',
  MultiLine = 'MultiLine',
  MultiGauge = 'MultiGauge',
  StackedBar = 'StackedBar',
  StackedArea = 'StackedArea',
  StackedGauge = 'StackedGauge',
  Heatmap = 'Heatmap',
}

export type ChartProps = {
  title?: string;
  table: AcicEvent;
  aggregation: AcicAggregation;
  duration: AcicAggregation;
};
export type GroupByChartProps = ChartProps & {
  groupBy: string;
};
