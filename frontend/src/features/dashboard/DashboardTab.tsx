import { JSX, useEffect, useRef, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';

import LoadingSpinner from '@/components/loading';
import { useAuth } from '@/providers/auth-context';

import { StoredWidget } from './components/form-widget';

import GlobalTrend from './components/trend/global-trend';
import WidgetActions from './components/widget-actions/widget-actions';
import WidgetRangeNavigation from './components/widget-actions/widget-range-navigation';
import useWidgetAPI from './hooks/use-widget';
import { ChartTypeComponents } from './lib/const';
import { ChartSize } from './lib/props';

export type ChartTiles = {
  id: string;
  content: JSX.Element;
  widget: StoredWidget;
};

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

interface DashboardTabProps {
  dashboardKey: string;
  onAddWidget?: (fn: (d: StoredWidget) => void) => void;
}

export default function DashboardTab({
  dashboardKey,
  onAddWidget = () => {},
}: DashboardTabProps) {
  const { query, add, edit, remove, patch, clone } = useWidgetAPI(dashboardKey);
  const { data, isLoading, isError } = query;
  const { user } = useAuth();
  const isOperator = user?.privileges === 'Operator';
  const chartRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const [refsUpdated, setRefsUpdated] = useState(false);
  const [pagesToChart, setPagesToChart] = useState<Record<string, number>>({});

  useEffect(() => {
    onAddWidget(() => add);
  }, [onAddWidget, add]);

  useEffect(() => {
    if (data && !refsUpdated) {
      const timer = setTimeout(() => {
        setRefsUpdated(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [data, refsUpdated]);

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

  const widgets: ChartTiles[] = data
    .map((widget: StoredWidget) => {
      const { id, size, type, ...chart } = widget;
      const Component = ChartTypeComponents[type];

      if (!Component) return null;

      return {
        id,
        widget,
        content: (
          <Component
            widgetId={id}
            {...chart}
            page={id ? (pagesToChart[id] ?? 0) : 0}
          />
        ),
      } as ChartTiles;
    })
    .filter((item): item is ChartTiles => item !== null);

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
          ref={(el) => {
            if (el) {
              chartRefsMap.current.set(item.id, el);
            } else {
              chartRefsMap.current.delete(item.id);
            }
          }}
        >
          {item.content}
          <GlobalTrend
            dashboardKey={dashboardKey}
            widgetId={item.id}
            widget={item.widget}
            chart={item.content}
          />
          <WidgetActions
            isOperator={isOperator}
            item={item}
            chartRef={chartRefsMap.current.get(item.id)}
            edit={edit}
            remove={remove}
            clone={clone}
            page={pagesToChart[item.id] ?? 0}
          />
          <WidgetRangeNavigation
            page={pagesToChart[item.id] ?? 0}
            onPageChange={(page) => {
              setPagesToChart((prev) => ({ ...prev, [item.id]: page }));
            }}
          />
        </div>
      ))}
    </ReactSortable>
  );
}
