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
}

export type ChartProps = {
  table: AcicEvent;
  aggregation: AcicAggregation;
  duration: AcicAggregation;
};
