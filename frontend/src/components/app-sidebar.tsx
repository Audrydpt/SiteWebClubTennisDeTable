import {
  Calendar,
  Cctv,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  FileOutput,
  Fingerprint,
  Gauge,
  LogOut,
  LucideProps,
  Map,
  Server,
  Settings,
  User2,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button.tsx';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { UserPrivileges, UserType } from '@/lib/authenticate';
import { useAuth } from '@/providers/auth-context';

import logo from '../assets/logo.svg';

interface SidebarItem {
  title: string;
  url: string;
  icon: React.FC<LucideProps>;
  children?: {
    title: string;
    url: string;
  }[];
  disabled?: boolean;
}

const settingsItems: SidebarItem[] = [
  { title: 'Cameras', url: '/cameras', icon: Cctv },
  { title: 'Outputs', url: '/outputs', icon: FileOutput },
  { title: 'Calendars', url: '/calendars', icon: Calendar },
  { title: 'Maintenance', url: '/maintenance', icon: Wrench },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    children: [{ title: 'Users', url: '/settings/users' }],
  },
];

const analyticsItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Gauge,
    children: [
      {
        title: 'Export data',
        url: '/dashboard/export',
      },
    ],
  },
  { title: 'Maps', url: '/maps', icon: Map },
  { title: 'Forensic', url: '/forensic', icon: Fingerprint },
] as SidebarItem[];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const allItems = [
  {
    title: 'Analytics',
    children: [...analyticsItems],
  },
  {
    title: 'Configurations',
    children: [...settingsItems],
  },
];

const testChildren: SidebarItem[] = [
  {
    title: 'Main dashboard',
    url: '/dashboard',
    icon: Gauge,
  },
  {
    title: 'Demo dashboard',
    url: '/dashboard/demo',
    icon: Gauge,
  },
  {
    title: 'All widgets',
    url: '/dashboard/test',
    icon: Gauge,
  },
];

const getFilteredItems = (user?: UserType) => {
  if (!user) return [];

  const isAdmin = user.privileges === UserPrivileges.Administrator;
  const isMaintainer = user.privileges === UserPrivileges.Maintainer;
  const isOperator = user.privileges === UserPrivileges.Operator;

  if (isAdmin) {
    return [
      { title: 'Analytics', children: analyticsItems },
      { title: 'Configurations', children: settingsItems },
    ];
  }

  if (isMaintainer) {
    return [
      { title: 'Analytics', children: analyticsItems },
      {
        title: 'Configurations',
        children: settingsItems.map((item) => ({
          ...item,
          disabled: item.title === 'Settings' || item.title === 'Users',
        })),
      },
    ];
  }

  if (isOperator) {
    return [
      {
        title: 'Analytics',
        children: analyticsItems.map((item) => ({
          ...item,
          children: item.title === 'Dashboard' ? undefined : item.children,
        })),
      },
    ];
  }

  return [];
};

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation('common');

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleLogout = () => {
    setShowConfirmDialog(true);
  };

  const cancelLogout = () => {
    setShowConfirmDialog(false);
  };

  const confirmLogout = () => {
    logout();
    setShowConfirmDialog(false);
  };

  if (!user) return null;
  const filteredItems = getFilteredItems(user);
  const current = window.location.hostname;
  const workspaces: string[] = [];

  if (current.startsWith('192.168.20.') || current.startsWith('local')) {
    // This should come from API.
    workspaces.push('localhost:5173');
    workspaces.push('192.168.20.44');
    workspaces.push('192.168.20.145');
    workspaces.push('192.168.20.150');

    // Development only.
    if (process.env.NODE_ENV === 'development')
      analyticsItems[0].children = [
        {
          title: 'Export data',
          url: '/dashboard/export',
          icon: FileOutput,
        },
        ...testChildren,
      ];
  } else {
    workspaces.push(current);
  }

  const navigate = (workspace: string) => {
    const protocol = workspace.startsWith('localhost') ? 'http' : 'https';
    window.location.href = `${protocol}://${workspace}/front-react/`;
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <img className="h-10" src={logo} alt="ACIC" />
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                      <Server />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {t('selectWorkspace')}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace}
                      onClick={() => navigate(workspace)}
                    >
                      <span>{workspace}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {filteredItems.map((section) => (
            <SidebarGroup key={section.title}>
              {allItems.length > 1 && (
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  <Collapsible className="group/collapsible">
                    {section.children.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild disabled={item.disabled}>
                          <Link
                            to={item.url}
                            className={
                              item.disabled
                                ? 'text-gray-400 pointer-events-none'
                                : ''
                            }
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.children && (
                          <>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuAction>
                                <ChevronDown />
                              </SidebarMenuAction>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.children.map((child) => (
                                  <SidebarMenuSubItem key={child.title}>
                                    <SidebarMenuSubButton asChild>
                                      <Link
                                        to={child.url}
                                        className={
                                          item.disabled
                                            ? '!text-gray-400 pointer-events-none'
                                            : ''
                                        }
                                      >
                                        <span>{child.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> {user.user}
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2" /> <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="ghost" onClick={cancelLogout}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
