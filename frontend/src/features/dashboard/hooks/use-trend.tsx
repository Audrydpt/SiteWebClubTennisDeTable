import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { StoredWidget } from '../components/form-widget';
import { AggregationTypeToObject } from '../lib/props';
import { roundDateTime } from '../lib/utils';

export default function useTrendAPI(
  dashboardKey: string,
  widgetId: string,
  widget: StoredWidget
) {
  return useQuery({
    queryKey: ['trend', dashboardKey, widgetId, widget],
    queryFn: async () => {
      const baseUrl = `${process.env.MAIN_API_URL}/dashboard/tabs/${dashboardKey}/widgets/${widgetId}/trends`;
      let timeFrom;
      let timeTo;
      const rounded = true; // Définir la variable manquante

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

      const data = (actualTrend.global.avg / globalTrend.global.avg) * 100;
      return Number(data.toFixed(2));
    },
    staleTime: 300000,
  });
}
