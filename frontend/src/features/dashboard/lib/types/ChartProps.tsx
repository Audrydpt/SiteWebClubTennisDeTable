export type AcicAggregationType =
  | '1 minute'
  | '15 minutes'
  | '30 minutes'
  | '1 hour'
  | '1 day'
  | '1 week'
  | '1 month'
  | '6 months'
  | '1 year'
  | '100 years';

export const AcicAggregationTypeToObject: Record<AcicAggregationType, object> =
  {
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

export type AcicEventType =
  | 'AcicUnattendedItem'
  | 'AcicCounting'
  | 'AcicNumbering'
  | 'AcicOccupancy'
  | 'AcicLicensePlate'
  | 'AcicOCR'
  | 'AcicAllInOneEvent'
  | 'AcicEvent';

export type ChartProps = {
  table: AcicEventType;
  aggregation: AcicAggregationType;
  duration: AcicAggregationType;
};
