import { DateTime, Duration } from 'luxon';

import { WhereClause } from '@/components/where-clauses';
import {
  AcicAggregation,
  AcicEvent,
  AggregationTypeToObject,
  ChartSize,
  ChartType,
} from './props';

export function getDurationInDays(durationStr: AcicAggregation): number {
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
      return { format: 'ccc dd', interval };
    case durationDays <= 30:
      return { format: 'dd LLL', interval };
    case durationDays <= 180:
      return { format: 'dd LLL', interval };
    default:
      return { format: 'LLL yyyy', interval };
  }
}

type DashboardQuery = {
  widgetId?: string;
  table: string;
  aggregation: AcicAggregation;
  duration?: AcicAggregation;
  range?: {
    from?: Date;
    to?: Date;
  };
  where?: WhereClause[];
};
export async function getWidgetDescription() {
  return fetch(`${process.env.MAIN_API_URL}/dashboard/widgets`).then((res) =>
    res.json()
  );
}

export function roundDateTime(
  dt: DateTime,
  aggregation: AcicAggregation
): DateTime {
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
      return dt
        .set({
          month: dt.month <= 6 ? 1 : 7,
          day: 15,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        })
        .startOf('month');
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
  page?: number,
  rounded = true
) {
  let timeFrom;
  let timeTo;

  if (props.aggregation && props.duration) {
    const now = rounded
      ? roundDateTime(DateTime.now(), props.aggregation)
      : DateTime.now();

    timeFrom = now.minus(AggregationTypeToObject[props.duration]);
    timeTo = now.minus({ millisecond: 1 });
    if (page !== undefined && page < 0) {
      const duration = Duration.fromObject(
        AggregationTypeToObject[props.duration]
      ).mapUnits((x) => x * (Math.abs(page) + 1));

      timeFrom = now.minus(duration);
      timeTo = timeFrom.plus(AggregationTypeToObject[props.duration]);
    }
  } else if (props.range && props.range.from && props.range.to) {
    timeFrom = DateTime.fromJSDate(props.range.from);
    timeTo = DateTime.fromJSDate(props.range.to);
  } else {
    throw new Error(
      'Either aggregation and duration or range must be provided'
    );
  }

  const query = `${process.env.MAIN_API_URL}/dashboard/widgets/${props.widgetId}`;
  const query1 = `${process.env.MAIN_API_URL}/dashboard/widgets/${props.table}`;

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

  if (props.widgetId === undefined) {
    return fetch(query1 + params).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
  }
  return fetch(query + params).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });

  // try {
  //   const [result, result1] = await Promise.all([
  //     fetch(query + params),
  //     fetch(query1 + params),
  //   ]);

  //   if (!result.ok) throw new Error(result.statusText);
  //   if (!result1.ok) throw new Error(result1.statusText);

  //   const data = await result.json();
  //   const data1 = await result1.json();

  //   const areEqual = JSON.stringify(data) === JSON.stringify(data1);

  //   console.log(
  //     `GetWidgetData:\nWidget : ${props.widgetId}\nQuery results are ${areEqual ? 'equal' : 'NOT equal'}`
  //   );
  //   console.log('Data from Materialized view: ', data);
  //   console.log('Data from Table: ', data1);

  //   if (areEqual) {
  //     console.log('Both endpoints returned identical data');
  //   } else {
  //     console.log('Materialized View data length:', data.length);
  //     console.log('Table data length:', data1.length);

  //     // Comparer les structures de données
  //     console.log('--- DIFFERENCES DÉTECTÉES ---');

  //     // Différence de longueur
  //     if (data.length !== data1.length) {
  //       console.log(
  //         `Différence de taille: View=${data.length}, Table=${data1.length}`
  //       );

  //       // Identifier les éléments supplémentaires
  //       if (data.length > data1.length) {
  //         console.log('Éléments supplémentaires dans Materialized View :');
  //         const dataTimestamps = new Set(
  //           data.map((item: { timestamp: string }) => item.timestamp)
  //         );
  //         const data1Timestamps = new Set(
  //           data1.map((item: { timestamp: string }) => item.timestamp)
  //         );
  //         const extraTimestamps = [...dataTimestamps].filter(
  //           (ts) => !data1Timestamps.has(ts)
  //         );
  //         const extraItems = data.filter((item: { timestamp: string }) =>
  //           extraTimestamps.includes(item.timestamp)
  //         );
  //         console.log(extraItems);
  //       } else {
  //         console.log('Éléments supplémentaires dans la Table :');
  //         const dataTimestamps = new Set(
  //           data.map((item: { timestamp: string }) => item.timestamp)
  //         );
  //         const data1Timestamps = new Set(
  //           data1.map((item: { timestamp: string }) => item.timestamp)
  //         );
  //         const extraTimestamps = [...data1Timestamps].filter(
  //           (ts) => !dataTimestamps.has(ts)
  //         );
  //         const extraItems = data1.filter((item: { timestamp: string }) =>
  //           extraTimestamps.includes(item.timestamp)
  //         );
  //         console.log(extraItems);
  //       }
  //     }

  //     // Comparer les valeurs pour les timestamps communs
  //     console.log('Différences de valeurs pour les mêmes timestamps:');
  //     const commonTimestamps = data
  //       .map((item: { timestamp: string }) => item.timestamp)
  //       .filter((ts: string) =>
  //         data1.some((item: { timestamp: string }) => item.timestamp === ts)
  //       );

  //     commonTimestamps.forEach((ts: string) => {
  //       const itemFromData = data.find(
  //         (item: { timestamp: string }) => item.timestamp === ts
  //       );
  //       const itemFromData1 = data1.find(
  //         (item: { timestamp: string }) => item.timestamp === ts
  //       );

  //       if (JSON.stringify(itemFromData) !== JSON.stringify(itemFromData1)) {
  //         console.log(`Timestamp: ${ts}`);
  //         console.log('  Materialized View:', itemFromData);
  //         console.log('  Table :', itemFromData1);

  //         // Comparer chaque propriété
  //         const allKeys = new Set([
  //           ...Object.keys(itemFromData || {}),
  //           ...Object.keys(itemFromData1 || {}),
  //         ]);

  //         allKeys.forEach((key) => {
  //           if (itemFromData?.[key] !== itemFromData1?.[key]) {
  //             console.log(
  //               `Propriété '${key}':\n  Materialized View data= ${itemFromData?.[key]}\n  Table data=${itemFromData1?.[key]}`
  //             );
  //           }
  //         });
  //       }
  //     });
  //   }
  //   console.log('--- FIN DES DIFFÉRENCES ---');
  //   console.log('areEqual :', areEqual);
  //   return areEqual ? data : data1;
  // } catch (error) {
  //   console.error('Error fetching widget data:', error);
  //   throw error;
  // }
}

export async function getWidgetDataForExport(
  props: DashboardQuery,
  groupBy?: string,
  page?: number,
  rounded = true
) {
  let timeFrom;
  let timeTo;

  if (props.aggregation && props.duration) {
    const now = rounded
      ? roundDateTime(DateTime.now(), props.aggregation)
      : DateTime.now();

    timeFrom = now.minus(AggregationTypeToObject[props.duration]);
    timeTo = now.minus({ millisecond: 1 });
    if (page !== undefined && page < 0) {
      const duration = Duration.fromObject(
        AggregationTypeToObject[props.duration]
      ).mapUnits((x) => x * (Math.abs(page) + 1));

      timeFrom = now.minus(duration);
      timeTo = timeFrom.plus(AggregationTypeToObject[props.duration]);
    }
  } else if (props.range && props.range.from && props.range.to) {
    timeFrom = DateTime.fromJSDate(props.range.from);
    timeTo = DateTime.fromJSDate(props.range.to);
  } else {
    throw new Error(
      'Either aggregation and duration or range must be provided'
    );
  }

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
        if (value.includes('|||')) {
          value
            .split('|||')
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
  return fetch(query + params).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
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
