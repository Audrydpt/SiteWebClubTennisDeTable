import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

type DashboardSettings = Record<string, string>;

interface IVMSSettings {
  type: string;
  ip: string;
  port: string;
  username?: string;
  password?: string;
}

export default function useVMSAPI() {
  const queryKey = ['vms'];
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
    mutationFn: async (value: IVMSSettings) => {
      const { data: updated } = await axios.put<DashboardSettings>(
        `${baseUrl}?key=vms`,
        {
          key: 'vms',
          value: JSON.stringify(value),
        }
      );
      return updated;
    },
    onMutate: async (value: IVMSSettings) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<DashboardSettings>(queryKey);

      client.setQueryData<DashboardSettings>(queryKey, (old) => ({
        ...old,
        vms: JSON.stringify(value),
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
