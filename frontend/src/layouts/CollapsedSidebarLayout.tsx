import { Outlet } from 'react-router-dom';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import TailwindSizeIndicator from '@/components/tailwind-size';

interface CollapsedSidebarLayoutProps {
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
}

export default function CollapsedSidebarLayout({
  sidebarOpen,
  onSidebarOpenChange,
}: CollapsedSidebarLayoutProps) {
  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={onSidebarOpenChange}>
      <AppSidebar />
      <SidebarInset className="flex-1">
        <header className="sticky top-0 z-50 flex h-10 items-center gap-2 border-b bg-muted px-2 md:hidden">
          <SidebarTrigger />
        </header>
        <div className="h-full w-full p-2 md:pl-4">
          <Outlet />
        </div>
      </SidebarInset>
      {process.env.NODE_ENV === 'development' && <TailwindSizeIndicator />}
    </SidebarProvider>
  );
}
