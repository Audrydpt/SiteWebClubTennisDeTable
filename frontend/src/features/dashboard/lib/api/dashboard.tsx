import { DateTime } from 'luxon';

import {
  AcicAggregation,
  AcicAggregationTypeToObject,
} from '../types/ChartProps';

type DashboardQuery = {
  table: string;
  aggregation: AcicAggregation;
  duration: AcicAggregation;
};

export async function GetDashboardDescription() {
  return fetch(`${process.env.MAIN_API_URL}/dashboard`).then((res) =>
    res.json()
  );
}

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
