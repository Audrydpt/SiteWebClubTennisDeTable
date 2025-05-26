import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { StoredWidget } from '../components/form-widget';
import { AggregationTypeToObject } from '../lib/props';
import { roundDateTime } from '../lib/utils';

export default function useTrendAPI(
  dashboardKey: string,
  widgetId: string,
  widget: StoredWidget,
  rounded: boolean = true
) {
  let timeFrom;
  let timeTo;

  if (widget.aggregation && widget.duration) {
    const now = rounded
      ? roundDateTime(DateTime.now(), widget.aggregation)
      : DateTime.now();

    timeFrom = now.minus(AggregationTypeToObject[widget.duration]);
    timeTo = now;
  } else {
    throw new Error(
      'Either aggregation and duration or range must be provided'
    );
  }

  let params = '?';
  params += `&time_from=${timeFrom.toUTC().toISO({ includeOffset: true })}`;
  params += `&time_to=${timeTo.toUTC().toISO({ includeOffset: true })}`;
  if (widget.groupBy) params += `&group_by=${widget.groupBy}`;

  const baseUrl = `${process.env.MAIN_API_URL}/dashboard/tabs/${dashboardKey}/widgets/${widgetId}/trends`;
  const globalAvgQueryKey = [
    'trend',
    dashboardKey,
    widgetId,
    widget,
    baseUrl,
    params,
  ];

  const trendAvg = useQuery({
    queryKey: globalAvgQueryKey,
    queryFn: async () => {
      const queryActualTrend = fetch(baseUrl + params).then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      });

      const queryGlobalTrend = fetch(baseUrl).then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      });

      const [actualTrend, globalTrend] = await Promise.all([
        queryActualTrend,
        queryGlobalTrend,
      ]);

      const data = 1 - globalTrend.global.avg / actualTrend.global.avg;
      return Number(data);
    },
  });

  const globalQueryKey = ['trend', dashboardKey, widgetId, widget, baseUrl];
  const globalTrend = useQuery({
    queryKey: globalQueryKey,
    queryFn: async () =>
      fetch(baseUrl).then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      }),
  });

  const trendInfoUrl = `${baseUrl}/${widget.aggregation}`;
  const trendInfoQueryKey = [
    'trend',
    dashboardKey,
    widgetId,
    widget,
    trendInfoUrl,
    params,
  ];

  const trendInfo = useQuery({
    queryKey: trendInfoQueryKey,
    queryFn: async () =>
      fetch(trendInfoUrl + params).then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      }),
  });

  return { trendAvg, globalTrend, trendInfo };
}
