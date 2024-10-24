import { useState } from 'react';
import { ReactSortable } from 'react-sortablejs';

import Header from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AddDashboard from './components/add-dashboard';
import AddWidget, { FormSchema } from './components/add-widget';
import AreaComponent from './components/charts/area';
import BarComponent from './components/charts/bar';
import LineComponent from './components/charts/line';
import { ChartProps, ChartSize, ChartType } from './lib/types/ChartProps';
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

type ChartComponentsType = {
  [K in ChartType]: React.ComponentType<ChartProps>;
};
const ChartTypeComponents: ChartComponentsType = {
  [ChartType.Area]: AreaComponent,
  [ChartType.Bar]: BarComponent,
  [ChartType.Line]: LineComponent,
} as const;

type ChartTiles = {
  id: string;
  size: ChartSize;
  content: JSX.Element;
};

export default function Charts() {
  const [widgets, setWidgets] = useState([] as ChartTiles[]);

  function addWidget(data: FormSchema) {
    const { size, type, ...chart } = data;
    const Component = ChartTypeComponents[type];

    const newWidget = {
      id: widgets.length.toString(),
      size,
      content: <Component {...chart} />,
    } as ChartTiles;
    setWidgets([...widgets, newWidget]);
  }

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
            setList={setWidgets}
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
