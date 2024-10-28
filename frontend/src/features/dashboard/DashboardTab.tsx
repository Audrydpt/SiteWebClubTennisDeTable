import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';

import { Button } from '@/components/ui/button';
import DeleteConfirmation from '@/components/ui/confirm-delete';
import LoadingSpinner from '@/components/ui/loading';

import { FormSchema, StoredWidget } from './components/add-widget';
import { ChartTypeComponents } from './lib/const';
import { ChartSize } from './lib/props';
import { getDashboardWidgets, setDashboardWidgets } from './lib/utils';

const widthClassMap: Record<ChartSize, string> = {
  tiny: 'col-span-1 md:col-span-1 lg:col-span-1 2xl:col-span-1',
  small: 'col-span-1 md:col-span-1 lg:col-span-1 2xl:col-span-2',
  medium: 'col-span-1 md:col-span-1 lg:col-span-2 2xl:col-span-3',
  large: 'col-span-1 md:col-span-2 lg:col-span-3 2xl:col-span-4',
  big: 'col-span-1 md:col-span-2 lg:col-span-4 2xl:col-span-5',
  full: 'col-span-1 md:col-span-2 lg:col-span-4 2xl:col-span-6',
};
const heightClassMap: Record<ChartSize, string> = {
  tiny: 'row-span-1',
  small: 'row-span-1',
  medium: 'row-span-1',
  large: 'row-span-2',
  big: 'row-span-2 2xl:row-span-4',
  full: 'row-span-2',
};

type ChartTiles = {
  id: string;
  size: ChartSize;
  content: JSX.Element;
};

interface DashboardTabProps {
  dashboardKey: string;
  onAddWidget: (fn: (d: FormSchema) => void) => void;
}

export default function DashboardTab({
  dashboardKey,
  onAddWidget,
}: DashboardTabProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-widgets', dashboardKey],
    queryFn: () => getDashboardWidgets(dashboardKey),
  });

  const { mutate } = useMutation({
    mutationFn: async (newWidgets: StoredWidget[]) =>
      setDashboardWidgets(dashboardKey, newWidgets),
    onMutate: (newWidgets) =>
      queryClient.setQueryData<StoredWidget[]>(
        ['dashboard-widgets', dashboardKey],
        newWidgets
      ),
  });

  const addWidget = useCallback(
    (d: FormSchema) => {
      const newWidget = { ...d, id: crypto.randomUUID() } as StoredWidget;
      mutate([...(data ?? []), newWidget]);
    },
    [data, mutate]
  );

  useEffect(() => {
    onAddWidget(() => addWidget);
  }, [onAddWidget, addWidget]);

  const handleSort = (newWidgets: ChartTiles[]) => {
    if (data) {
      const reorderedData = newWidgets.map((widget: ChartTiles) =>
        data.find((stored) => stored.id === widget.id)
      ) as StoredWidget[];

      if (JSON.stringify(reorderedData) !== JSON.stringify(data))
        mutate(reorderedData);
    }
  };

  const handleEdit = () => {};

  const handleDelete = (id: string) => {
    if (data) {
      const newWidgets = data.filter((widget) => widget.id !== id);
      mutate(newWidgets);
    }
  };

  if (isLoading || !data || isError) return <LoadingSpinner />;

  const widgets =
    data.map((d: StoredWidget) => {
      const { id, size, type, ...chart } = d;
      const Component = ChartTypeComponents[type];
      return {
        id,
        size,
        content: <Component {...chart} />,
      } as ChartTiles;
    }) ?? [];

  return (
    <ReactSortable
      list={widgets}
      setList={handleSort}
      className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-2"
    >
      {widgets.map((item: ChartTiles) => (
        <div
          key={item.id}
          data-id={item.id}
          className={`${widthClassMap[item.size]} ${heightClassMap[item.size]} group relative`}
        >
          {item.content}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="icon" onClick={() => handleEdit()}>
              <Pencil className="h-4 w-4" />
            </Button>

            <DeleteConfirmation
              onDelete={() => handleDelete(item.id)}
              description="Cette action est irréversible. Le widget sera définitivement supprimé du dashboard."
              trigger={
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>
      ))}
    </ReactSortable>
  );
}
