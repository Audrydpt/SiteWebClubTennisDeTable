import NoSidebarLayout from '@/layouts/NoSidebarLayout';
import SidebarLayout from '@/layouts/SidebarLayout';
import { useAuth } from '@/providers/auth-context';

interface OptionalSidebarLayoutProps {
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
}

export default function OptionalSidebarLayout({
  sidebarOpen,
  onSidebarOpenChange,
}: OptionalSidebarLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user && user.privileges !== 'Anonymous') {
    return (
      <SidebarLayout
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={onSidebarOpenChange}
      />
    );
  }

  return <NoSidebarLayout />;
}
