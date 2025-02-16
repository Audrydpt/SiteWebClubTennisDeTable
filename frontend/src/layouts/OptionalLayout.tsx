import NoSidebarLayout from '@/layouts/NoSidebarLayout';
import SidebarLayout from '@/layouts/SidebarLayout';
import { useAuth } from '@/providers/auth-context';

export default function OptionalSidebarLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user && user.privileges !== 'Anonymous') {
    return <SidebarLayout />;
  }

  return <NoSidebarLayout />;
}
