import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { FormSchema, StoredWidget } from '../components/form-widget';

async function getDashboardWidgets(id: string) {
  return fetch(`${process.env.MAIN_API_URL}/dashboard/tabs/${id}/widgets`).then(
    (res) => res.json() as Promise<StoredWidget[]>
  );
}
async function patchDashboardWidgets(
  id: string,
  oldData: StoredWidget[],
  newData: StoredWidget[]
) {
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

      // We only have the id left if nothing has changed
      if (Object.keys(delta).length > 1) acc.push(delta);

      return acc;
    },
    []
  );

  if (changedWidgets.length === 0) {
    return Promise.resolve([]);
  }

  return fetch(`${process.env.MAIN_API_URL}/dashboard/tabs/${id}/widgets`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(changedWidgets),
  }).then((res) => res.json());
}
async function addDashboardWidget(id: string, data: FormSchema) {
  return fetch(`${process.env.MAIN_API_URL}/dashboard/tabs/${id}/widgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((res) => res.json() as Promise<string>); // return the guid of the new widget
}
async function editDashboardWidget(
  dashboard_id: string,
  widget_id: string,
  data: StoredWidget
) {
  return fetch(
    `${process.env.MAIN_API_URL}/dashboard/tabs/${dashboard_id}/widgets/${widget_id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  ).then((res) => res.json());
}
async function deleteDashboardWidget(dashboard_id: string, widget_id: string) {
  return fetch(
    `${process.env.MAIN_API_URL}/dashboard/tabs/${dashboard_id}/widgets/${widget_id}`,
    {
      method: 'DELETE',
    }
  ).then((res) => res.json());
}

export default function useWidgetAPI(dashboardKey: string) {
  const queryKey = ['dashboard-widgets', dashboardKey];
  const client = useQueryClient();

  const query = useQuery({
    queryKey,
    queryFn: () => getDashboardWidgets(dashboardKey),
    refetchInterval: 60 * 1000,
  });

  const handleMutationError = (
    context: { previous: StoredWidget[] } | undefined
  ) => {
    if (context?.previous) {
      client.setQueryData(queryKey, context.previous);
    }
  };

  const { mutate: add } = useMutation({
    mutationFn: async (formData: FormSchema) => {
      const previous = client.getQueryData<StoredWidget[]>(queryKey);

      const temp = {
        ...formData,
        id: crypto.randomUUID(),
        order: previous?.length,
      } as StoredWidget;

      const widgetId = await addDashboardWidget(dashboardKey, temp);

      return { ...temp, id: widgetId };
    },
    onMutate: async (formData: FormSchema) => {
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
    onSuccess: (savedWidget: StoredWidget, _variables, context) => {
      // Update the temporary widget with the real one from the server
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
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: FormSchema;
    }) => {
      const temp = {
        ...formData,
        id,
        order: client
          .getQueryData<StoredWidget[]>(queryKey)
          ?.find((w) => w.id === id)?.order,
      } as StoredWidget;

      await editDashboardWidget(dashboardKey, id, temp);
      return temp;
    },
    onMutate: async ({ id, formData }) => {
      const previous = client.getQueryData<StoredWidget[]>(queryKey);

      const temp = {
        ...formData,
        id,
        order: previous?.find((w) => w.id === id)?.order,
      } as StoredWidget;

      client.setQueryData<StoredWidget[]>(queryKey, (old) => {
        if (!old) return [temp];
        return old.map((widget) => (widget.id === id ? temp : widget));
      });

      return { previous };
    },
    onError: handleMutationError,
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (widgetId: string) => {
      await deleteDashboardWidget(dashboardKey, widgetId);
      return widgetId;
    },
    onMutate: async (widgetId: string) => {
      const previous = client.getQueryData<StoredWidget[]>(queryKey);

      client.setQueryData<StoredWidget[]>(
        queryKey,
        (old) => old?.filter((widget) => widget.id !== widgetId) ?? []
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
      await patchDashboardWidgets(dashboardKey, oldData, newData);
      return newData;
    },
    onMutate: async ({
      oldData,
      newData,
    }: {
      oldData: StoredWidget[];
      newData: StoredWidget[];
    }) => {
      client.setQueryData<StoredWidget[]>(queryKey, newData);
      return { oldData };
    },
    onError: handleMutationError,
  });

  return { query, add, edit, remove, patch };
}
