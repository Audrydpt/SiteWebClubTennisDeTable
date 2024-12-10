import {
  Calendar,
  Cctv,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  FileOutput,
  Fingerprint,
  Gauge,
  LucideProps,
  Map,
  Server,
  Settings,
  User2,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { UserType } from '@/lib/authenticate';

import logo from '../assets/logo.svg';

interface SidebarItem {
  title: string;
  url: string;
  icon: React.FC<LucideProps>;
  children?: [
    {
      title: string;
      url: string;
    },
  ];
}

const analyticsItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Gauge,
    children: [
      {
        title: 'Main dahsboard',
        url: '/dashboard',
        icon: Gauge,
      },
      {
        title: 'Demo dahsboard',
        url: '/dashboard/demo',
        icon: Gauge,
      },
      {
        title: 'All widgets',
        url: '/dashboard/test',
        icon: Gauge,
      },
    ],
  },
  {
    title: 'Maps',
    url: '/maps',
    icon: Map,
  },
  {
    title: 'Forensic',
    url: '/forensic',
    icon: Fingerprint,
  },
] as SidebarItem[];

const settingsItems = [
  {
    title: 'Cameras',
    url: '/cameras',
    icon: Cctv,
  },
  {
    title: 'Outputs',
    url: '/outputs',
    icon: FileOutput,
  },
  {
    title: 'Calendars',
    url: '/calendars',
    icon: Calendar,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
  {
    title: 'Maintenance',
    url: '/maintenance',
    icon: Wrench,
  },
] as SidebarItem[];

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

export default function AppSidebar({ user }: { user?: UserType }) {
  const current = window.location.hostname;
  const workspaces: string[] = [];

  // Hard-coded demo for ACIC environment. Should come from API.
  if (current.startsWith('192.168.20.') || current.startsWith('local')) {
    workspaces.push('localhost:5173');
    workspaces.push('192.168.20.44');
    workspaces.push('192.168.20.145');
    workspaces.push('192.168.20.150');
  } else {
    workspaces.push(current);
  }

  const navigate = (workspace: string) => {
    const protocol = workspace.startsWith('localhost') ? 'http' : 'https';
    window.location.href = `${protocol}://${workspace}/front-react/`;
  };

  return (
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
                      Select Workspace
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
        {allItems.map((items) => (
          <SidebarGroup key={items.title}>
            {allItems.length > 1 && (
              <SidebarGroupLabel>{items.title}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible className="group/collapsible">
                  {items.children.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url}>
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
                                    <Link to={child.url}>
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
                  <User2 /> {user ? user.user : 'Anonymous'}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
