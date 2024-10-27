import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactSortable } from 'react-sortablejs';

import Header from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import useLocalStorage from '@/hooks/use-localstorage';
import LoadingSpinner from '@/components/ui/loading';

import AddDashboard from './components/add-dashboard';
import { AddWidget, FormSchema, StoredWidget } from './components/add-widget';
import { ChartTypeComponents } from './lib/const';
import { ChartSize } from './lib/props';
import { getDashboardWidgets, setDashboardWidgets } from './lib/utils';
import TestCharts from './TestDashboard';

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

export default function Charts() {
  const queryClient = useQueryClient();
  const dashboardKey = '223d8eb4-9574-4cab-90a7-8c1d9e6a28f9';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-widgets', dashboardKey],
    queryFn: () => getDashboardWidgets(dashboardKey),
  });

  const mutation = useMutation({
    mutationFn: async (newWidgets: StoredWidget[]) =>
      setDashboardWidgets(dashboardKey, newWidgets),
    onMutate: (newWidgets) =>
      queryClient.setQueryData<StoredWidget[]>(
        ['dashboard-widgets', dashboardKey],
        newWidgets
      ),
  });

  if (isLoading || !data || isError) {
    return <LoadingSpinner />;
  }

  const widgets =
    data?.map((d: StoredWidget) => {
      const { id, size, type, ...chart } = d;
      const Component = ChartTypeComponents[type];
      return {
        id,
        size,
        content: <Component {...chart} />,
      } as ChartTiles;
    }) ?? [];

  const addWidget = (d: FormSchema) => {
    const newWidget = { ...d, id: crypto.randomUUID() } as StoredWidget;
    mutation.mutate([...(data ?? []), newWidget]);
  };

  const handleSort = (newWidgets: ChartTiles[]) => {
    const reorderedData = newWidgets.map((widget: ChartTiles) =>
      data?.find((stored) => stored.id === widget.id)
    ) as StoredWidget[];

    if (JSON.stringify(reorderedData) !== JSON.stringify(data))
      mutation.mutate(reorderedData);
  };

  return (
    <>
      <Header title="Dashboard">
        <AddDashboard />
        <AddWidget onSubmit={(d) => addWidget(d)} />
      </Header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Main dashboard</TabsTrigger>
          <TabsTrigger value="tables">All widgets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="w-full">
          <ReactSortable
            list={widgets}
            setList={handleSort}
            className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-2"
          >
            {widgets.map((item: ChartTiles) => (
              <div
                key={item.id}
                data-id={item.id}
                className={`${widthClassMap[item.size]} ${heightClassMap[item.size]}`}
              >
                {item.content}
              </div>
            ))}
          </ReactSortable>
        </TabsContent>
        <TabsContent value="tables" className="w-full">
          <TestCharts />
        </TabsContent>
      </Tabs>
    </>
  );
}
