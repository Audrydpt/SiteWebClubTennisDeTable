import { Route, Routes } from 'react-router-dom';

import ProtectedRoute from '@/components/protected-routes';
import NoSidebarLayout from '@/layouts/NoSidebarLayout';
import { UserPrivileges } from '@/lib/authenticate';

import OptionalSidebarLayout from './layouts/OptionalLayout';
import { lazyLoadFeature } from './lib/i18n';
import Login from './pages/Login';

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
const Maintenance = lazyLoadFeature(
  () => import('./features/maintenance/Maintenance')
);
const Users = lazyLoadFeature(() => import('./features/users/Users'));

export default function App() {
  return (
    <Routes>
      {/* Routes protégées nécessitant une authentification. */}
      <Route element={<OptionalSidebarLayout />}>
        <Route element={<ProtectedRoute role={UserPrivileges.Operator} />}>
          <Route path="/dashboard/demo" element={<DemoDashboard />} />
          <Route path="/dashboard/test" element={<TestDashboard />} />
          <Route path="/dashboard/export" element={<ExportDashboard />} />

          <Route path="*" element={<h1>Welcome!</h1>} />
        </Route>

        <Route element={<ProtectedRoute role={UserPrivileges.Maintainer} />}>
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/settings/users" element={<Users />} />
        </Route>

        <Route
          element={<ProtectedRoute role={UserPrivileges.Administrator} />}
        />

        {/* Routes publiques où la sidebar apparait si connecté */}
        <Route path="/dashboard/:dashboardId/*" element={<Dashboard />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
      </Route>

      {/* Routes publiques sans sidebar */}
      <Route element={<NoSidebarLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="*" element={<h1>Not Found somewhere!</h1>} />
    </Routes>
  );
}
