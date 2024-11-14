import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { StoredDashboard } from '../components/form-dashboard';

type DashboardRecord = Record<string, StoredDashboard>;

export default function useDashboardAPI() {
  const queryKey = ['dashboard'];
  const client = useQueryClient();
  const baseUrl = `${process.env.MAIN_API_URL}/dashboard/tabs`;

  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: () => axios.get<DashboardRecord>(baseUrl).then(({ data }) => data),
    refetchInterval: 60_000,
  });

  const handleMutationError = (
    context: { previous: DashboardRecord } | undefined
  ) => {
    if (context?.previous) {
      client.setQueryData(queryKey, context.previous);
    }
  };

  const { mutateAsync: add } = useMutation({
    mutationFn: async (formData: StoredDashboard) => {
      const dashboards = client.getQueryData<DashboardRecord>(queryKey);
      const order = dashboards ? Object.keys(dashboards).length : 0;

      const tempId = crypto.randomUUID();
      const temp: StoredDashboard = {
        ...formData,
        id: tempId,
        order,
      };

      const { data: created } = await axios.post<StoredDashboard>(
        baseUrl,
        temp
      );
      return { ...temp, id: created.id };
    },
    onMutate: async (formData: StoredDashboard) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<DashboardRecord>(queryKey);
      const order = previous ? Object.keys(previous).length : 0;

      const tempId = crypto.randomUUID();
      const temp: StoredDashboard = {
        ...formData,
        id: tempId,
        order,
      };

      client.setQueryData<DashboardRecord>(queryKey, (old) => ({
        ...old,
        [tempId]: temp,
      }));

      return { previous, tempId };
    },
    onSuccess: async (savedWidget: StoredDashboard, _variables, context) => {
      client.setQueryData<DashboardRecord>(queryKey, (old) => {
        const lastId = savedWidget.id as string;
        if (!old) return { [lastId]: savedWidget };

        const rest = Object.entries(old).reduce((acc, [id, widget]) => {
          if (id === context?.tempId) return acc;
          return { ...acc, [id]: widget };
        }, {} as DashboardRecord);
        return { ...rest, [lastId]: savedWidget };
      });
      return savedWidget;
    },
    onError: handleMutationError,
  });

  const { mutate: edit } = useMutation({
    mutationFn: async (data: StoredDashboard) => {
      await axios.put<DashboardRecord>(`${baseUrl}/${data.id}`, data);
    },
    onMutate: async (data: StoredDashboard) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<DashboardRecord>(queryKey);

      client.setQueryData<DashboardRecord>(queryKey, (old) => ({
        ...old,
        [String(data.id)]: data,
      }));

      return { previous };
    },
    onError: handleMutationError,
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) =>
      axios.delete<DashboardRecord>(`${baseUrl}/${id}`),
    onMutate: async (id: string) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<DashboardRecord>(queryKey);

      client.setQueryData<DashboardRecord>(queryKey, (old) => {
        if (!old) return {};

        const rest = Object.entries(old).reduce((acc, [key, value]) => {
          if (key === id) return acc;
          return { ...acc, [key]: value };
        }, {} as DashboardRecord);

        return rest;
      });

      return { previous };
    },
    onError: handleMutationError,
  });

  const { mutate: patch } = useMutation({
    mutationFn: async ({
      oldData,
      newData,
    }: {
      oldData: DashboardRecord;
      newData: DashboardRecord;
    }) => {
      const changedWidgets = Object.entries(newData).reduce(
        (acc: Partial<StoredDashboard>[], [id, newWidget]) => {
          const oldWidget = oldData[id];
          if (!oldWidget) return acc;

          const delta = { ...newWidget } as Partial<StoredDashboard>;

          Object.keys(newWidget).forEach((key) => {
            const k = key as keyof StoredDashboard;
            if (key !== 'id' && oldWidget[k] === newWidget[k]) delete delta[k];
          });

          if (Object.keys(delta).length > 1) acc.push(delta);

          return acc;
        },
        []
      );

      if (
        changedWidgets.length === 0 ||
        (changedWidgets.length === 1 && Object.keys(changedWidgets)[0] === 'id')
      ) {
        return newData;
      }

      await axios.patch<DashboardRecord>(baseUrl, changedWidgets);
      return newData;
    },
    onMutate: async ({
      oldData,
      newData,
    }: {
      oldData: DashboardRecord;
      newData: DashboardRecord;
    }) => {
      await client.cancelQueries({ queryKey });

      client.setQueryData<DashboardRecord>(queryKey, newData);
      return { oldData };
    },
    onError: handleMutationError,
  });

  return { query, add, edit, remove, patch };
}
