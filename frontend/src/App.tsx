import { useQuery } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import useSession from './hooks/use-session';
import Layout from './layout';
import GetUser from './lib/api/authenticate';

const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const DemoDashboard = lazy(() => import('./features/dashboard/DemoDashboard'));

export default function App() {
  const sessionId = useSession();
  const { data } = useQuery({
    queryKey: [sessionId],
    queryFn: () => GetUser(sessionId),
  });

  return (
    <Layout user={data}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<h1>Welcome</h1>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/demo" element={<DemoDashboard />} />
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
