import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { VMSFormValues } from '../lib/types';

export default function useVMSAPI(options?: { customValue?: VMSFormValues }) {
  const queryKey = ['vms'];
  const client = useQueryClient();
  const baseUrl = `${process.env.MAIN_API_URL}/settings/vms`;

  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: () => axios.get(baseUrl).then(({ data }) => data),
  });

  // Test VMS settings with a POST request
  const currentSettings = query.data;
  const testValue = options?.customValue || currentSettings;

  const describeQuery = useQuery({
    queryKey: ['vmsTest', testValue],
    queryFn: () => {
      if (!testValue) {
        return Promise.resolve(null);
      }
      return axios
        .post(`${process.env.MAIN_API_URL}/vms/test`, testValue)
        .then(({ data }) => data)
        .catch(() => null);
    },
    enabled: !!testValue,
  });

  const handleMutationError = (
    context: { previous: VMSFormValues } | undefined
  ) => {
    if (context?.previous) {
      client.setQueryData(queryKey, context.previous);
    }
  };

  const { mutate: edit } = useMutation({
    mutationFn: async (value: VMSFormValues) => {
      const { data: updated } = await axios.put<VMSFormValues>(baseUrl, value);
      return updated;
    },
    onMutate: async (value: VMSFormValues) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<VMSFormValues>(queryKey);

      client.setQueryData<VMSFormValues>(queryKey, () => value);

      return { previous };
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey });
    },
    onError: handleMutationError,
  });

  return { query, describeQuery, edit };
}
