import { ReactSortable } from 'react-sortablejs';

import Header from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useLocalStorage from '@/hooks/use-localstorage';

import AddDashboard from './components/add-dashboard';
import { AddWidget, FormSchema } from './components/add-widget';
import { ChartTypeComponents } from './lib/const';
import { ChartSize } from './lib/props';
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

type StoredWidget = FormSchema & {
  id: string;
};

export default function Charts() {
  const { value: storedWidgets, setValue: setStoredWidgets } = useLocalStorage<
    StoredWidget[]
  >('dashboard-widgets', []);

  const widgets = storedWidgets.map((data) => {
    const { id, size, type, ...chart } = data;
    const Component = ChartTypeComponents[type];
    return {
      id,
      size,
      content: <Component {...chart} />,
    } as ChartTiles;
  });

  function addWidget(data: FormSchema) {
    const newWidget = { ...data, id: crypto.randomUUID() };
    setStoredWidgets([...storedWidgets, newWidget]);
  }

  const handleSort = (newWidgets: ChartTiles[]) => {
    const reorderedData = newWidgets.map(
      (widget) => storedWidgets.find((stored) => stored.id === widget.id)!
    );
    setStoredWidgets(reorderedData);
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
            {widgets.map((item) => (
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
