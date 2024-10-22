import { useQuery } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppSidebar from './components/app-sidebar';
import { SidebarTrigger } from './components/ui/sidebar';
import useSession from './hooks/use-session';
import GetUser from './lib/api/authenticate';

const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));

export default function App() {
  const sessionId = useSession();
  const { data } = useQuery({
    queryKey: [sessionId],
    queryFn: () => GetUser(sessionId),
  });

  return (
    <>
      <AppSidebar />
      <main>
        <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-muted px-4 md:hidden">
          <SidebarTrigger />
        </header>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<h1>Welcome</h1>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<h1>Not Found</h1>} />
          </Routes>
        </Suspense>
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </main>
    </>
  );
}
