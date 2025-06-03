import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';

import DeleteConfirmation from '@/components/confirm-delete';
import Header from '@/components/header';
import LoadingSpinner from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/providers/auth-context';

import { FormDashboard, StoredDashboard } from './components/form-dashboard';
import { FormWidget, StoredWidget } from './components/form-widget';
import DashboardTab from './DashboardTab';
import useDashboardAPI from './hooks/use-dashboard';
import PublicDashboard from './PublicDashboard.tsx';
import TestDashboard from './TestDashboard';

function DashboardContent() {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOperator = user?.privileges === 'Operator';

  const [addWidgetFn, setAddWidgetFn] = useState<(d: StoredWidget) => void>(
    () => {}
  );

  const { query, add, remove } = useDashboardAPI();
  const { data, isLoading, isError } = query;
  const { t } = useTranslation();

  const effectiveDashboardId =
    data && (!dashboardId || !data[dashboardId])
      ? Object.keys(data)[0]
      : dashboardId;

  useEffect(() => {
    if (effectiveDashboardId !== dashboardId) {
      navigate(`/dashboard/${effectiveDashboardId}`, { replace: true });
    }
  }, [effectiveDashboardId, dashboardId, navigate]);

  if (isError) return <div>Something went wrong</div>;
  if (isLoading || !data) return <LoadingSpinner />;

  const couldBeRemoved = (key: string) => {
    if (!data || isOperator) return false;
    if (Object.keys(data).length === 1) return false;
    if (key !== dashboardId) return false;
    return data[key].title.toLowerCase() !== 'main dashboard';
  };

  const handleAdd = async (d: StoredDashboard) => {
    const newDashboard = await add(d);
    if (newDashboard.id) navigate(`/dashboard/${newDashboard.id}`);
  };

  const handleDelete = (key: string) => {
    if (couldBeRemoved(key)) {
      remove(key);
      navigate('/dashboard');
    }
  };

  return (
    <>
      <Header title={t('dashboard:dashboard.header')}>
        {!isOperator && (
          <FormDashboard onSubmit={handleAdd}>
            <Button variant="outline">
              <Plus /> {t('dashboard:dashboard.add')}
            </Button>
          </FormDashboard>
        )}
        {!isOperator && (
          <FormWidget onSubmit={addWidgetFn}>
            <Button variant="outline">
              <Plus /> {t('dashboard:widget.add')}
            </Button>
          </FormWidget>
        )}
      </Header>

      <Tabs
        className="w-full"
        value={effectiveDashboardId}
        onValueChange={(value) => navigate(`/dashboard/${value}`)}
      >
        <TabsList className="w-full justify-start">
          {Object.entries(data).map(([key, value]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="relative group flex-none"
            >
              <span>{value.title}</span>

              {couldBeRemoved(key) && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteConfirmation
                    onDelete={() => handleDelete(key)}
                    description={t('dashboard:dashboard.deleteConfirmation')}
                  >
                    <Button variant="destructive" className="size-4 p-0">
                      <Trash2 className="h-3! w-3!" />
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
  const { isAuthenticated } = useAuth();
  const { dashboardId } = useParams();

  if (!isAuthenticated) {
    if (!dashboardId) return <Navigate to="/login" />;
    return <PublicDashboard dashboardKey={dashboardId} />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardContent />} />
      <Route path="/:dashboardId" element={<DashboardContent />} />
    </Routes>
  );
}
