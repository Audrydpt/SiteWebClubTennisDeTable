import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';

export const formSchema = z.object({
  days: z.number().min(1).max(3650),
});

export type FormValues = z.infer<typeof formSchema>;

export function useRetentionAPI() {
  const queryKey = ['retention'];
  const client = useQueryClient();
  const baseUrl = `${process.env.MAIN_API_URL}/settings/retention`;

  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: () => axios.get(baseUrl).then(({ data }) => data),
  });

  const handleMutationError = (
    context: { previous: FormValues } | undefined
  ) => {
    if (context?.previous) {
      client.setQueryData(queryKey, context.previous);
    }
  };

  const { mutate: edit } = useMutation({
    mutationFn: async (value: FormValues) => {
      const { data: updated } = await axios.put<FormValues>(baseUrl, value);
      return updated;
    },
    onMutate: async (value: FormValues) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<FormValues>(queryKey);
      client.setQueryData<FormValues>(queryKey, value);

      return { previous };
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey });
    },
    onError: handleMutationError,
  });

  return { query, edit };
}
