import { Edit3, Trash2 } from 'lucide-react';
import { JSX, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';

import DeleteConfirmation from '@/components/confirm-delete';
import LoadingSpinner from '@/components/loading';
import { Button } from '@/components/ui/button';

import {
  FormWidget,
  StoredWidget,
  WidgetSchema,
} from './components/form-widget';
import useWidgetAPI from './hooks/use-widget';
import { ChartTypeComponents } from './lib/const';
import { ChartSize } from './lib/props';

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
  content: JSX.Element;
  widget: StoredWidget;
};

interface DashboardTabProps {
  dashboardKey: string;
  onAddWidget: (fn: (d: WidgetSchema) => void) => void;
}

export default function DashboardTab({
  dashboardKey,
  onAddWidget,
}: DashboardTabProps) {
  const { query, add, edit, remove, patch } = useWidgetAPI(dashboardKey);
  const { data, isLoading, isError } = query;

  useEffect(() => {
    onAddWidget(() => add);
  }, [onAddWidget, add]);

  const handleSort = (newWidgets: ChartTiles[]) => {
    if (data) {
      const reordered = newWidgets
        .map((widget: ChartTiles, index: number) => {
          const storedWidget = data.find((stored) => stored.id === widget.id);
          if (!storedWidget) return null;

          return {
            ...storedWidget,
            order: index,
          } as StoredWidget;
        })
        .filter((w): w is StoredWidget => w !== null);

      if (JSON.stringify(reordered) !== JSON.stringify(data)) {
        patch({ oldData: data, newData: reordered });
      }
    }
  };

  if (isError) return <div>Something went wrong</div>;
  if (isLoading || !data) return <LoadingSpinner />;

  const widgets =
    data.map((widget: StoredWidget) => {
      const { id, size, type, ...chart } = widget;
      const Component = ChartTypeComponents[type];
      return {
        id,
        widget,
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
          className={`${widthClassMap[item.widget.size]} ${heightClassMap[item.widget.size]} group relative`}
        >
          {item.content}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <FormWidget
              onSubmit={(d) => edit({ ...item.widget, ...d })}
              defaultValues={item.widget}
              edition
            >
              <Button variant="outline" size="icon">
                <Edit3 className="h-4 w-4" />
              </Button>
            </FormWidget>

            <DeleteConfirmation
              onDelete={() => remove(item.id)}
              description="Cette action est irréversible. Le widget sera définitivement supprimé du dashboard."
            >
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DeleteConfirmation>
          </div>
        </div>
      ))}
    </ReactSortable>
  );
}
