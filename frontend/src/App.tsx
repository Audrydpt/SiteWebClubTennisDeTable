import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import ProtectedRoute from '@/components/protected-routes';
import useSidebarState from '@/hooks/use-sidebar-state';
import NoSidebarLayout from '@/layouts/NoSidebarLayout';
import { UserPrivileges } from '@/lib/authenticate';

import CollapsedSidebarLayout from '@/layouts/CollapsedSidebarLayout';
import LoadingSpinner from './components/loading';
import { Toaster } from './components/ui/sonner';
import OptionalSidebarLayout from './layouts/OptionalLayout';
import { lazyLoadFeature } from './lib/i18n';
import Error from './pages/Error';
import Home from './pages/Home';
import Login from './pages/Login';

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
const Settings = lazyLoadFeature(
  'settings',
  () => import('./features/settings/Settings')
);
const Users = lazyLoadFeature(
  'settings',
  () => import('./features/settings/components/users')
);
const Retention = lazyLoadFeature(
  'settings',
  () => import('./features/settings/components/retention')
);
const ForensicSettings = lazyLoadFeature(
  'settings',
  () => import('./features/settings/components/forensic-settings')
);
const ForensicOld = lazyLoadFeature(
  'forensic',
  () => import('./features/forensic.old/ForensicMain')
);
const ForensicNew = lazyLoadFeature(
  'forensic',
  () => import('./features/forensic/ForensicMain')
);
const Camera = lazyLoadFeature(
  'camera',
  () => import('./features/camera/Camera')
);
const Theme = lazyLoadFeature('theme', () => import('./pages/Theme'));

export default function App() {
  const { open, setOpen } = useSidebarState();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes without sidebar */}
        <Route element={<NoSidebarLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Routes with mandatory sidebar */}
        <Route
          element={
            <CollapsedSidebarLayout
              sidebarOpen={open}
              onSidebarOpenChange={setOpen}
            />
          }
        >
          <Route element={<ProtectedRoute role={UserPrivileges.Operator} />}>
            <Route path="/forensic">
              <Route index element={<ForensicNew />} />
              <Route path=":taskId/*" element={<ForensicNew />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute role={UserPrivileges.Operator} />}>
            <Route path="/forensic.old">
              <Route index element={<ForensicOld />} />
              <Route path=":taskId/*" element={<ForensicOld />} />
            </Route>
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
          <Route path="/theme" element={<Theme />} />

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
              <Route index element={<Settings />} />
              <Route path="users" element={<Users />} />
              <Route path="retention" element={<Retention />} />
              <Route path="forensicSettings" element={<ForensicSettings />} />
            </Route>
          </Route>

          {/* Operator routers */}
          <Route element={<ProtectedRoute role={UserPrivileges.Operator} />}>
            <Route path="/cameras" element={<Camera />} />
          </Route>

          {/* Catch-all for authenticated routes */}
          <Route path="*" element={<Error type="404" />} />
        </Route>
      </Routes>
      <Toaster />
    </Suspense>
  );
}
