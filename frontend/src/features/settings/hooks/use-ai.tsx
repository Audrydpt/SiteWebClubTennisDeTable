import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';

type DashboardSettings = Record<string, string>;

export const aiSchema = z.object({
  ip: z.string().min(7).ip(),
  port: z.number().int().min(1).max(65535),
  object: z.string().min(1),
  vehicle: z.string().min(1),
  person: z.string().min(1),
});

export type AISettings = z.infer<typeof aiSchema>;

export function useAIAPI() {
  const queryKey = ['ai'];
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
    mutationFn: async (value: AISettings) => {
      const { data: updated } = await axios.put<DashboardSettings>(
        `${baseUrl}/ai`,
        {
          value,
        }
      );
      return updated;
    },
    onMutate: async (value: AISettings) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<DashboardSettings>(queryKey);

      client.setQueryData<DashboardSettings>(queryKey, (old) => ({
        ...old,
        ai: JSON.stringify(value),
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
