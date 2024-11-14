import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { StoredWidget } from '../components/form-widget';

export default function useWidgetAPI(dashboardKey: string) {
  const queryKey = ['dashboard-widgets', dashboardKey];
  const client = useQueryClient();
  const baseUrl = `${process.env.MAIN_API_URL}/dashboard/tabs/${dashboardKey}/widgets`;

  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: () => axios.get<StoredWidget[]>(baseUrl).then(({ data }) => data),
    refetchInterval: 60_000,
  });

  const handleMutationError = (
    context: { previous: StoredWidget[] } | undefined
  ) => {
    if (context?.previous) {
      client.setQueryData(queryKey, context.previous);
    }
  };

  const { mutateAsync: add } = useMutation({
    mutationFn: async (formData: StoredWidget) => {
      const previous = client.getQueryData<StoredWidget[]>(queryKey);

      const temp = {
        ...formData,
        id: crypto.randomUUID(),
        order: previous?.length,
      } as StoredWidget;

      const { data: created } = await axios.post<StoredWidget>(baseUrl, temp);
      return { ...temp, id: created.id };
    },
    onMutate: async (formData: StoredWidget) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<StoredWidget[]>(queryKey);

      const temp = {
        ...formData,
        id: crypto.randomUUID(),
        order: previous?.length ?? 0,
      } as StoredWidget;

      client.setQueryData<StoredWidget[]>(queryKey, (old) => {
        if (!old) return [temp];
        return [...old, temp];
      });

      return { previous, tempId: temp.id };
    },
    onSuccess: async (savedWidget: StoredWidget, _variables, context) => {
      client.setQueryData<StoredWidget[]>(queryKey, (old) => {
        if (!old) return [savedWidget];
        return old.map((widget) =>
          widget.id === context?.tempId ? savedWidget : widget
        );
      });
    },
    onError: handleMutationError,
  });

  const { mutate: edit } = useMutation({
    mutationFn: async (data: StoredWidget) => {
      await axios.put(`${baseUrl}/${data.id}`, data);
    },
    onMutate: async (data: StoredWidget) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<StoredWidget[]>(queryKey);

      client.setQueryData<StoredWidget[]>(
        queryKey,
        (old) =>
          old?.map((widget) => (widget.id === data.id ? data : widget)) ?? [
            data,
          ]
      );

      return { previous };
    },
    onError: handleMutationError,
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => axios.delete(`${baseUrl}/${id}`),
    onMutate: async (id: string) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<StoredWidget[]>(queryKey);
      client.setQueryData<StoredWidget[]>(
        queryKey,
        (old) => old?.filter((widget) => widget.id !== id) ?? []
      );
      return { previous };
    },
    onError: handleMutationError,
  });

  const { mutate: patch } = useMutation({
    mutationFn: async ({
      oldData,
      newData,
    }: {
      oldData: StoredWidget[];
      newData: StoredWidget[];
    }) => {
      const oldWidgetsMap = new Map(oldData.map((w) => [w.id, w]));

      const changedWidgets = newData.reduce(
        (acc: Partial<StoredWidget>[], newWidget) => {
          const oldWidget = oldWidgetsMap.get(newWidget.id);
          if (!oldWidget) return acc;

          const delta = { ...newWidget } as Partial<StoredWidget>;

          Object.keys(newWidget).forEach((key) => {
            const k = key as keyof StoredWidget;
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

      await axios.patch(baseUrl, changedWidgets);
      return newData;
    },
    onMutate: async ({
      oldData,
      newData,
    }: {
      oldData: StoredWidget[];
      newData: StoredWidget[];
    }) => {
      await client.cancelQueries({ queryKey });

      client.setQueryData<StoredWidget[]>(queryKey, newData);
      return { oldData };
    },
    onError: handleMutationError,
  });

  return { query, add, edit, remove, patch };
}
