import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function useExportAPI(
  table: string,
  startDate: string,
  endDate: string
) {
  const queryKey = ['export', table, startDate, endDate];
  const baseUrl = `${process.env.MAIN_API_URL}/dashboard/widget/`;
  const streamByEvent = `${table}?aggregate=100%20years&group_by=stream_id&time_from=${startDate}&time_to=${endDate}`;

  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: () => axios.get(baseUrl + streamByEvent).then(({ data }) => data),
    enabled: !!table && !!startDate && !!endDate,
    refetchInterval: 30_000,
  });

  const optionsQuery = useQuery({
    queryKey: ['options', table, baseUrl],
    queryFn: () => axios.get(baseUrl).then(({ data }) => data[table]),
    enabled: !!table,
  });

  return {
    ...query,
    options: optionsQuery.data,
    optionsLoading: optionsQuery.isLoading,
    optionsError: optionsQuery.error,
  };
}
