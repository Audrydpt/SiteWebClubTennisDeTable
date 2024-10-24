import { DateTime } from 'luxon';

import { AcicAggregation } from '../types/ChartProps';

type DashboardQuery = {
  table: string;
  aggregation: AcicAggregation;
  duration: AcicAggregation;
};

type AggregationToObject = {
  [K in AcicAggregation]: object;
};

const AcicAggregationTypeToObject: AggregationToObject = {
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

export async function GetDashboard(props: DashboardQuery) {
  const now = DateTime.now();

  const timeFrom = now.minus(AcicAggregationTypeToObject[props.duration]);
  const timeTo = now;

  return fetch(
    `${process.env.MAIN_API_URL}/dashboard/${props.table}?aggregate=${props.aggregation}&time_from=${timeFrom.toISO({ includeOffset: false })}&time_to=${timeTo.toISO({ includeOffset: false })}`
  ).then((res) => res.json());
}

export async function GetDashboardGroupBy(
  props: DashboardQuery,
  group_by: string
) {
  const now = DateTime.now();

  const timeFrom = now.minus(AcicAggregationTypeToObject[props.duration]);
  const timeTo = now;

  return fetch(
    `${process.env.MAIN_API_URL}/dashboard/${props.table}?aggregate=${props.aggregation}&time_from=${timeFrom.toISO({ includeOffset: false })}&time_to=${timeTo.toISO({ includeOffset: false })}&group_by=${group_by}`
  ).then((res) => res.json());
}
