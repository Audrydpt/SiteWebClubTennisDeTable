import { Navigate } from 'react-router-dom';

import { useAuth } from '@/providers/auth-context';

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Navigate to="/dashboard" />;
}
