import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AppSidebar from './components/app-sidebar';
import { UserType } from './lib/api/authenticate';

export default function Layout({
  user,
  children,
}: {
  user?: UserType;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-muted px-4 md:hidden">
          <SidebarTrigger />
        </header>
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-center gap-6 p-6 sm:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
