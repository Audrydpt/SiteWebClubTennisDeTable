import { DateTime } from 'luxon';

import { AcicAggregation, AggregationTypeToObject } from './props';

function getDurationInDays(durationStr: string): number {
  const [amount, unit] = durationStr.split(' ');
  switch (unit) {
    case 'minute':
    case 'minutes':
      return (1 / 24 / 60) * Number(amount);
    case 'hour':
      return (1 / 24) * Number(amount);
    case 'day':
    case 'days':
      return Number(amount);
    case 'week':
    case 'weeks':
      return 7 * Number(amount);
    case 'month':
    case 'months':
      return 30 * Number(amount);
    case 'year':
    case 'years':
      return 365 * Number(amount);
    default:
      return 1;
  }
}

export function getTimeFormattingConfig(
  duration: AcicAggregation,
  dataLength: number
) {
  const durationDays = getDurationInDays(duration);
  const targetPoints = 8;
  const interval = Math.max(1, Math.floor(dataLength / targetPoints));

  switch (true) {
    case durationDays <= 1:
      return { format: 'HH:mm', interval };
    case durationDays <= 7:
      return {
        format: dataLength > 48 ? 'ccc HH:mm' : 'ccc dd HH:mm',
        interval,
      };
    case durationDays <= 30:
      return { format: 'dd LLL', interval };
    case durationDays <= 180:
      return { format: 'dd LLL', interval };
    default:
      return { format: 'LLL yyyy', interval };
  }
}

type DashboardQuery = {
  table: string;
  aggregation: AcicAggregation;
  duration: AcicAggregation;
};
export async function getWidgetDescription() {
  return fetch(`${process.env.MAIN_API_URL}/dashboard/widgets`).then((res) =>
    res.json()
  );
}

export async function getWidgetData(props: DashboardQuery, groupBy?: string) {
  const now = DateTime.now();

  const timeFrom = now.minus(AggregationTypeToObject[props.duration]);
  const timeTo = now;

  return fetch(
    `${process.env.MAIN_API_URL}/dashboard/widgets/${props.table}?aggregate=${props.aggregation}&time_from=${timeFrom.toISO({ includeOffset: false })}&time_to=${timeTo.toISO({ includeOffset: false })}${groupBy ? `&group_by=${groupBy}` : ''}`
  ).then((res) => res.json());
}
