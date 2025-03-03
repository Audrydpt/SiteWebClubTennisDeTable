import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import useSidebarState from '@/hooks/use-sidebar-state';

import ProtectedRoute from '@/components/protected-routes';
import NoSidebarLayout from '@/layouts/NoSidebarLayout';
import { UserPrivileges } from '@/lib/authenticate';

import LoadingSpinner from './components/loading';
import OptionalSidebarLayout from './layouts/OptionalLayout';
import CollapsedSidebarLayout from '@/layouts/CollapsedSidebarLayout';
import { lazyLoadFeature } from './lib/i18n';
import Error from './pages/Error';
import Home from './pages/Home';
import Login from './pages/Login';
import Theme from './pages/Theme';
import Forensic from '@/features/forensic/Forensic.tsx';

const Dashboard = lazyLoadFeature(
  'dashboard',
  () => import('./features/dashboard/Dashboard')
);
const DemoDashboard = lazyLoadFeature(
  'dashboard',
  () => import('./features/dashboard/DemoDashboard')
);
const TestDashboard = lazyLoadFeature(
  'dashboard',
  () => import('./features/dashboard/TestDashboard')
);
const ExportDashboard = lazyLoadFeature(
  'dashboard',
  () => import('./features/dashboard/ExportDashboard')
);
const Maintenance = lazyLoadFeature(
  'maintenance',
  () => import('./features/maintenance/Maintenance')
);
const Users = lazyLoadFeature(
  'settings',
  () => import('./features/settings/Users')
);

export default function App() {
  const { open, setOpen } = useSidebarState();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes without sidebar */}
        <Route element={<NoSidebarLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Forensic routes */}
        <Route
          element={
            <CollapsedSidebarLayout
              sidebarOpen={open}
              onSidebarOpenChange={setOpen}
            />
          }
        >
          <Route element={<ProtectedRoute role={UserPrivileges.Operator} />}>
            <Route path="/forensic" element={<Forensic />} />
          </Route>
        </Route>

        {/* Routes with optional sidebar */}
        <Route
          element={
            <OptionalSidebarLayout
              sidebarOpen={open}
              onSidebarOpenChange={setOpen}
            />
          }
        >
          <Route path="/" element={<Home />} />

          {/* Dashboard routes */}
          <Route path="/dashboard">
            <Route index element={<Dashboard />} />
            <Route path=":dashboardId/*" element={<Dashboard />} />

            {/* Protected dashboard features */}
            <Route element={<ProtectedRoute role={UserPrivileges.Operator} />}>
              <Route path="demo" element={<DemoDashboard />} />
              <Route path="test" element={<TestDashboard />} />
              <Route path="export" element={<ExportDashboard />} />
            </Route>
          </Route>

          {/* Maintainer routes */}
          <Route element={<ProtectedRoute role={UserPrivileges.Maintainer} />}>
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/settings">
              <Route index element={<Users />} />
              <Route path="users" element={<Users />} />
            </Route>

            <Route path="/theme" element={<Theme />} />
          </Route>

          {/* Catch-all for authenticated routes */}
          <Route path="*" element={<Error type="404" />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
