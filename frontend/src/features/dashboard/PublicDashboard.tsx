import { JSX } from 'react';

import LoadingSpinner from '@/components/loading';

import { StoredWidget } from './components/form-widget';
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

export type ChartTiles = {
  id: string;
  content: JSX.Element;
  widget: StoredWidget;
};

export interface PublicDashboardProps {
  dashboardKey: string;
}

export default function PublicDashboard({
  dashboardKey,
}: PublicDashboardProps) {
  const { query } = useWidgetAPI(dashboardKey);

  const { data, isLoading, isError } = query;

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
        content: <Component widgetId={id} {...chart} />,
      } as ChartTiles;
    })
    .filter((item): item is ChartTiles => item !== null);

  return (
    <div
      role="grid"
      className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-2"
    >
      {widgets.map(({ id, widget, content }) => (
        <div
          key={id}
          data-id={id}
          className={`${widthClassMap[widget.size]} ${heightClassMap[widget.size]}`}
        >
          {content}
        </div>
      ))}
    </div>
  );
}
