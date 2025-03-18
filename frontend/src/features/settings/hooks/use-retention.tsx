import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

type DashboardSettings = Record<string, string>;

export default function useRetentionAPI() {
  const queryKey = ['retention'];
  const client = useQueryClient();
  const baseUrl = `${process.env.MAIN_API_URL}/dashboard/settings`;

  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: () => axios.get(baseUrl).then(({ data }) => data),
  });

  const handleMutationError = (
    context: { previous: DashboardSettings } | undefined
  ) => {
    if (context?.previous) {
      client.setQueryData(queryKey, context.previous);
    }
  };

  const { mutate: edit } = useMutation({
    mutationFn: async (value: number) => {
      const { data: updated } = await axios.put<DashboardSettings>(
        `${baseUrl}?key=retention`,
        {
          key: 'retention',
          value: value.toString(),
        }
      );
      return updated;
    },
    onMutate: async (value: number) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<DashboardSettings>(queryKey);

      client.setQueryData<DashboardSettings>(queryKey, (old) => ({
        ...old,
        retention: value.toString(),
      }));

      return { previous };
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey });
    },
    onError: handleMutationError,
  });

  return { query, edit };
}
