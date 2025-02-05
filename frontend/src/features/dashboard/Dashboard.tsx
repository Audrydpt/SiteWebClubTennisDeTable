import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';

import DeleteConfirmation from '@/components/confirm-delete';
import Header from '@/components/header';
import LoadingSpinner from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import DashboardTab from './DashboardTab';
import TestDashboard from './TestDashboard';
import { DashboardSchema, FormDashboard } from './components/form-dashboard';
import { FormWidget, WidgetSchema } from './components/form-widget';
import useDashboardAPI from './hooks/use-dashboard';

function DashboardContent() {
  const { dashboardId } = useParams();
  const setDashboardId = useNavigate();

  const [addWidgetFn, setAddWidgetFn] = useState<(d: WidgetSchema) => void>(
    () => {}
  );

  const { query, add, remove } = useDashboardAPI();
  const { data, isLoading, isError } = query;

  if (isError) return <div>Something went wrong</div>;
  if (isLoading || !data) return <LoadingSpinner />;

  const effectiveDashboardId =
    data && (!dashboardId || !data[dashboardId])
      ? Object.keys(data)[0]
      : dashboardId;

  const couldBeRemoved = (key: string) => {
    if (!data) return false;
    if (Object.keys(data).length === 1) return false;
    if (key !== dashboardId) return false;
    if (data[key].title.toLowerCase() === 'main dashboard') return false;
    return true;
  };

  const handleAdd = async (d: DashboardSchema) => {
    const newDashboard = await add(d);
    if (newDashboard.id) setDashboardId(newDashboard.id);
  };

  const handleDelete = (key: string) => {
    if (couldBeRemoved(key)) {
      remove(key);
      setDashboardId('');
    }
  };

  return (
    <>
      <Header title="Dashboard">
        <FormDashboard onSubmit={handleAdd}>
          <Button variant="outline">
            <Plus /> Add Dashboard
          </Button>
        </FormDashboard>
        <FormWidget onSubmit={addWidgetFn}>
          <Button variant="outline">
            <Plus /> Add Widget
          </Button>
        </FormWidget>
      </Header>

      <Tabs
        className="w-full"
        value={effectiveDashboardId}
        onValueChange={(value) => setDashboardId(value)}
      >
        <TabsList className="w-full justify-start">
          {Object.entries(data).map(([key, value]) => (
            <TabsTrigger key={key} value={key} className="relative group">
              <span>{value.title}</span>

              {couldBeRemoved(key) && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteConfirmation
                    onDelete={() => handleDelete(key)}
                    description="This action is irreversible. The dashboard will be permanently deleted."
                  >
                    <Button variant="destructive" className="h-4 w-4 p-0">
                      <Trash2 className="!h-3 !w-3" />
                    </Button>
                  </DeleteConfirmation>
                </div>
              )}
            </TabsTrigger>
          ))}
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

export default function Dashboard() {
  return (
    <Routes>
      <Route path="/" element={<DashboardContent />}>
        <Route path=":dashboardId" element={<DashboardContent />} />
      </Route>
    </Routes>
  );
}
