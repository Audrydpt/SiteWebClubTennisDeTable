import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import LoadingSpinner from '@/components/loading';
import useSession from './hooks/use-session';
import Layout from './layout';
import { AuthError, getCurrentUser } from './lib/authenticate';

import { lazyLoadFeature } from './lib/i18n';

const Dashboard = lazyLoadFeature(
  () => import('./features/dashboard/Dashboard')
);
const DemoDashboard = lazyLoadFeature(
  () => import('./features/dashboard/DemoDashboard')
);
const TestDashboard = lazyLoadFeature(
  () => import('./features/dashboard/TestDashboard')
);
const ExportDashboard = lazyLoadFeature(
  () => import('./features/dashboard/ExportDashboard')
);
const Camera = lazyLoadFeature(() => import('./features/camera/Camera'));

export default function App() {
  const sessionId = useSession();
  const { data } = useQuery({
    queryKey: [sessionId],
    queryFn: () => getCurrentUser(sessionId),
    retry: (_count, err) => !(err instanceof AuthError && err.status === 401),
  });

  return (
    <Layout user={data}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<h1>Welcome</h1>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/demo" element={<DemoDashboard />} />
          <Route path="/dashboard/test" element={<TestDashboard />} />
          <Route path="/dashboard/export" element={<ExportDashboard />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/cameras" element={<Camera />} />
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
