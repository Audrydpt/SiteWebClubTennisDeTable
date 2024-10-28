import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import Header from '@/components/header';
import LoadingSpinner from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import DashboardTab from './DashboardTab';
import TestDashboard from './TestDashboard';
import AddDashboard from './components/add-dashboard';
import { AddWidget, FormSchema } from './components/add-widget';
import { getDashboards } from './lib/utils';

export default function Dashboard() {
  const [currentDashboard, setCurrentDashboard] = useState<string>();
  const [addWidgetFn, setAddWidgetFn] = useState<(d: FormSchema) => void>(
    () => {}
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboards'],
    queryFn: getDashboards,
  });

  useEffect(() => {
    if (data) setCurrentDashboard(Object.keys(data)[0]);
  }, [data]);

  if (isError) return <div>Something went wrong</div>;
  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <>
      <Header title="Dashboard">
        <AddDashboard />
        <AddWidget onSubmit={addWidgetFn} />
      </Header>

      <Tabs
        className="w-full"
        value={currentDashboard}
        onValueChange={setCurrentDashboard}
      >
        <TabsList className="w-full justify-start">
          {Object.entries(data).map(([key, value]) => (
            <TabsTrigger key={key} value={key}>
              {value.title}
            </TabsTrigger>
          ))}
          <TabsTrigger value="tables">All widgets</TabsTrigger>
        </TabsList>

        {Object.keys(data).map((key) => (
          <TabsContent key={key} value={key} className="w-full">
            <DashboardTab dashboardKey={key} onAddWidget={setAddWidgetFn} />
          </TabsContent>
        ))}

        <TabsContent value="tables" className="w-full">
          <TestDashboard />
        </TabsContent>
      </Tabs>
    </>
  );
}
