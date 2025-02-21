import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import AppSidebar from '@/components/app-sidebar';
import TailwindSizeIndicator from '@/components/tailwind-size';

export default function SidebarLayout() {
  const [open, setOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-muted px-4 md:hidden">
          <SidebarTrigger />
        </header>
        <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-6 p-6 sm:p-8">
          <Outlet />
        </div>
      </SidebarInset>
      {process.env.NODE_ENV === 'development' && <TailwindSizeIndicator />}
    </SidebarProvider>
  );
}
