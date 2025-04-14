import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';

export const aiSchema = z.object({
  ip: z.string().min(7).ip(),
  port: z.number().int().min(1).max(65535),
  object: z.string().min(1),
  vehicle: z.string().min(1),
  person: z.string().min(1),
});

export type AISettings = z.infer<typeof aiSchema>;

export function useAIAPI(options?: { customIP?: string; customPort?: number }) {
  const queryKey = ['ai'];
  const client = useQueryClient();
  const baseUrl = `${process.env.MAIN_API_URL}/settings/ai`;

  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: () => axios.get(baseUrl).then(({ data }) => data),
  });

  // Query the describe endpoint when IP or port changes
  const currentSettings = query.data?.ai;
  const ip = options?.customIP || currentSettings?.ip;
  const port = options?.customPort || currentSettings?.port;

  const describeQuery = useQuery({
    queryKey: ['aiDescribe', ip, port],
    queryFn: () => {
      if (!ip || !port) {
        return Promise.resolve(null);
      }
      return axios
        .get(`${process.env.MAIN_API_URL}/proxy/${ip}:${port}/describe`)
        .then(({ data }) => {
          const models = {
            detector: [] as { model: string; name: string }[],
            classifier: [] as { model: string; name: string }[],
          };

          Object.keys(data).forEach((key) => {
            if (key === 'version') return;
            if (key[0] !== '/') return;
            const model = data[key];
            if (model.task === 'detector') {
              models.detector.push({ model: key, name: model.name });
            } else if (model.task === 'classifier') {
              models.classifier.push({ model: key, name: model.name });
            } else if (model.task === undefined) {
              models.detector.push({ model: key, name: model.name });
              models.classifier.push({ model: key, name: model.name });
            }
          });

          return models;
        })
        .catch(() => null);
    },
    enabled: !!ip && !!port,
    // Initialize describeQuery with a placeholder for the models so selects
    // can have valid options when loading with saved settings
    placeholderData: () => {
      if (query.data) {
        const { object, vehicle, person } = query.data;
        return {
          detector: object ? [{ model: object, name: object }] : [],
          classifier: [
            ...(vehicle ? [{ model: vehicle, name: vehicle }] : []),
            ...(person ? [{ model: person, name: person }] : []),
          ],
        };
      }
      return null;
    },
  });

  const handleMutationError = (
    context: { previous: AISettings } | undefined
  ) => {
    if (context?.previous) {
      client.setQueryData(queryKey, context.previous);
    }
  };

  const { mutate: edit } = useMutation({
    mutationFn: async (value: AISettings) => {
      const { data: updated } = await axios.put<AISettings>(baseUrl, value);
      return updated;
    },
    onMutate: async (value: AISettings) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<AISettings>(queryKey);
      client.setQueryData<AISettings>(queryKey, value);

      return { previous };
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey });
    },
    onError: handleMutationError,
  });

  return { query, describeQuery, edit };
}
