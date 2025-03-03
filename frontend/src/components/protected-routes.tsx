import { Navigate, Outlet } from 'react-router-dom';

import { UserPrivileges } from '@/lib/authenticate';
import { useAuth } from '@/providers/auth-context';

interface ProtectedRouteProps {
  role?: UserPrivileges;
}

const UserPrivilegesHierarchy: Record<UserPrivileges, number> = {
  [UserPrivileges.Anonymous]: 0,
  [UserPrivileges.Operator]: 1,
  [UserPrivileges.Maintainer]: 2,
  [UserPrivileges.Administrator]: 3,
};

export default function ProtectedRoute({
  role = UserPrivileges.Anonymous,
}: ProtectedRouteProps) {
  const { user, isLoading, isSessionExpired } = useAuth();

  if (
    !isLoading &&
    (isSessionExpired ||
      UserPrivilegesHierarchy[user?.privileges || 'Anonymous'] <
        UserPrivilegesHierarchy[role])
  ) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}
