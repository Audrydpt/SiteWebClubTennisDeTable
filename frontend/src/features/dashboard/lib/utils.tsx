import { DateTime } from 'luxon';

import { WhereClause } from '@/components/where-clauses';
import {
  AcicAggregation,
  AcicEvent,
  AggregationTypeToObject,
  ChartSize,
  ChartType,
} from './props';

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

type ChartSizePoints = {
  [K in ChartSize]: number;
};
export const chartSizePoints = {
  [ChartSize.tiny]: 6,
  [ChartSize.small]: 8,
  [ChartSize.medium]: 10,
  [ChartSize.large]: 12,
  [ChartSize.big]: 16,
  [ChartSize.full]: 20,
} as ChartSizePoints;

export function getTimeFormattingConfig(
  duration: AcicAggregation,
  dataLength: number,
  size: ChartSize
) {
  const durationDays = getDurationInDays(duration);
  const targetPoints = chartSizePoints[size];
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
  where?: WhereClause[];
};
export async function getWidgetDescription() {
  return fetch(`${process.env.MAIN_API_URL}/dashboard/widgets`).then((res) =>
    res.json()
  );
}

function roundDateTime(dt: DateTime, aggregation: AcicAggregation): DateTime {
  switch (aggregation) {
    case '1 minute':
      return dt.startOf('minute');
    case '15 minutes':
      return dt.set({
        minute: Math.floor(dt.minute / 15) * 15,
        second: 0,
        millisecond: 0,
      });
    case '30 minutes':
      return dt.set({
        minute: Math.floor(dt.minute / 30) * 30,
        second: 0,
        millisecond: 0,
      });
    case '1 hour':
      return dt.startOf('hour');
    case '1 day':
      return dt.startOf('day');
    case '1 week':
      return dt.startOf('week');
    case '1 month':
      return dt.startOf('month');
    case '6 months':
      return dt.set({
        month: Math.floor(dt.month / 6) * 6,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    case '1 year':
      return dt.startOf('year');
    case '100 years':
      return dt.startOf('year');
    default:
      return dt;
  }
}

export async function getWidgetData(
  props: DashboardQuery,
  groupBy?: string,
  rounded = true
) {
  const now = rounded
    ? roundDateTime(DateTime.now(), props.aggregation)
    : DateTime.now();

  const timeFrom = now.minus(AggregationTypeToObject[props.duration]);
  const timeTo = now.minus({ millisecond: 1 });

  const query = `${process.env.MAIN_API_URL}/dashboard/widgets/${props.table}`;

  let params = '?';
  params += `&aggregate=${props.aggregation}`;
  params += `&time_from=${timeFrom.toISO({ includeOffset: false })}`;
  params += `&time_to=${timeTo.toISO({ includeOffset: false })}`;

  if (groupBy) params += `&group_by=${groupBy}`;

  if (props.where) {
    const columns = Array.isArray(props.where) ? props.where : [props.where];

    columns.forEach((where) => {
      const { column, value } = where;

      if (column && value && column !== 'any' && value.length > 0) {
        if (value.includes(',')) {
          value
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v.length > 0)
            .forEach((v) => {
              params += `&${column}=${encodeURIComponent(v)}`;
            });
        } else {
          params += `&${column}=${encodeURIComponent(value)}`;
        }
      }
    });
  }

  return fetch(query + params).then((res) => res.json());
}

type DashboardTab = Record<string, { title: string }>;
export async function getDashboards() {
  return fetch(`${process.env.MAIN_API_URL}/dashboard/tabs`).then(
    (res) => res.json() as Promise<DashboardTab>
  );
}

// In fact, it should be StoredWidget instead of WidgetQuery, but got cycle import error
type WidgetQuery = {
  id: string;
  size: ChartSize;
  type: ChartType;
  table: AcicEvent;
  aggregation: AcicAggregation;
  duration: AcicAggregation;
  groupBy?: string;
  layout: string;
  title: string;
  order?: number;
};
export async function getDashboardWidgets(id: string) {
  return fetch(`${process.env.MAIN_API_URL}/dashboard/tabs/${id}/widgets`).then(
    (res) => res.json() as Promise<WidgetQuery[]>
  );
}
export async function setDashboardWidgets(id: string, widgets: WidgetQuery[]) {
  return fetch(`${process.env.MAIN_API_URL}/dashboard/tabs/${id}/widgets`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      widgets.map((widget, index) => ({ ...widget, order: index }))
    ),
  }).then((res) => res.json());
}
