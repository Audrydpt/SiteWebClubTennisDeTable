import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SidebarProvider } from '@/components/ui/sidebar';
import { UserPrivileges, UserType } from '@/lib/authenticate';
import AppSidebar from './app-sidebar';

// Mock the logo import
vi.mock('../assets/logo.svg', () => ({
  default: 'mocked-logo.svg',
}));

interface MockAuthState {
  currentUser: UserType | null;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string;
}

const mockAuthState: MockAuthState = {
  currentUser: null,
  logout: vi.fn(),
  isAuthenticated: false,
  isLoading: false,
  sessionId: 'test-session-id',
};

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    user: mockAuthState.currentUser,
    isAuthenticated: !!mockAuthState.currentUser,
    isLoading: false,
    sessionId: 'test-session-id',
    logout: mockAuthState.logout,
  }),
}));

beforeEach(() => {
  mockAuthState.currentUser = null;
});

const mockUsers: Record<string, UserType> = {
  admin: {
    user: 'AdminUser',
    privileges: UserPrivileges.Administrator,
  },
  maintainer: {
    user: 'MaintainerUser',
    privileges: UserPrivileges.Maintainer,
  },
  operator: {
    user: 'OperatorUser',
    privileges: UserPrivileges.Operator,
  },
  anonymous: {
    user: 'Anonymous',
    privileges: UserPrivileges.Anonymous,
  },
};

const renderSidebar = (aUser?: UserType) => {
  mockAuthState.currentUser = aUser || {
    user: 'Administrator',
    privileges: UserPrivileges.Administrator,
  };

  render(
    <MemoryRouter>
      <SidebarProvider open>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>
  );
};

describe('AppSidebar', () => {
  // Reset mocks and environment before each test
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    window.location.href = 'http://localhost:5173/front-react/';
  });

  describe('Basic Rendering', () => {
    it('renders with administrator user', () => {
      renderSidebar(mockUsers.admin);
      expect(screen.getByText('AdminUser')).toBeInTheDocument();
    });

    it('renders with maintainer user', () => {
      renderSidebar(mockUsers.maintainer);
      expect(screen.getByText('MaintainerUser')).toBeInTheDocument();
    });

    it('renders with operator user', () => {
      renderSidebar(mockUsers.operator);
      expect(screen.getByText('OperatorUser')).toBeInTheDocument();
    });

    it('renders all navigation sections', () => {
      renderSidebar();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Configurations')).toBeInTheDocument();
    });

    it('renders all main navigation items', () => {
      renderSidebar();
      const expectedNavItems = [
        'Dashboard',
        'Maps',
        'Forensic',
        'Cameras',
        'Outputs',
        'Calendars',
        'Settings',
        'Maintenance',
      ];
      expectedNavItems.forEach((item) => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });

    it('renders children correctly', () => {
      renderSidebar();
      expect(screen.getByText('selectWorkspace')).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    describe('Workspace Selection', () => {
      it('opens workspace dropdown when clicked', async () => {
        Object.defineProperty(window, 'location', {
          value: { hostname: 'example.com' },
          writable: true,
        });
        const user = userEvent.setup();
        renderSidebar();

        const workspaceButton = screen.getByRole('button', {
          name: 'selectWorkspace',
        });
        await user.click(workspaceButton);

        // Current hostname should always be present
        await screen.findByRole('menuitem', { name: /example\.com/i });
      });

      it('navigates to selected workspace with correct protocol', async () => {
        const user = userEvent.setup();
        let hrefValue = '';
        Object.defineProperty(window, 'location', {
          value: {
            hostname: '192.168.20.44',
            set href(val: string) {
              hrefValue = val;
            },
          },
          writable: true,
        });

        renderSidebar();
        const workspaceButton = screen.getByRole('button', {
          name: 'selectWorkspace',
        });
        await user.click(workspaceButton);

        const localhostOption = await screen.findByRole('menuitem', {
          name: /localhost:5173/i,
        });
        await user.click(localhostOption);
        expect(hrefValue).toBe('http://localhost:5173/front-react/');
      });

      it('does not navigate when closing the dropdown', async () => {
        const user = userEvent.setup();
        let hrefValue = '';
        Object.defineProperty(window, 'location', {
          value: {
            hostname: '192.168.20.44',
            set href(val: string) {
              hrefValue = val;
            },
          },
          writable: true,
        });

        renderSidebar();
        const workspaceButton = screen.getByRole('button', {
          name: 'selectWorkspace',
        });
        await user.click(workspaceButton);

        await user.keyboard('{Escape}');
        expect(hrefValue).toBe('');
      });
    });

    describe('Navigation Menu', () => {
      it('expands submenu when clicked', async () => {
        renderSidebar();
        const dashboardItem = screen.getByText('Dashboard').closest('li');
        if (!dashboardItem) throw new Error('Dashboard menu item not found');

        const expandButton = dashboardItem
          .querySelector('button svg')
          ?.closest('button');
        if (!expandButton) throw new Error('Expand button not found');

        fireEvent.click(expandButton);

        expect(await screen.findByText('Export data')).toBeInTheDocument();
      });

      it('collapses submenu when clicked again', async () => {
        renderSidebar();
        const dashboardItem = screen.getByText('Dashboard').closest('li');
        if (!dashboardItem) throw new Error('Dashboard menu item not found');

        const expandButton = dashboardItem
          .querySelector('button svg')
          ?.closest('button');
        if (!expandButton) throw new Error('Expand button not found');

        // Expand
        fireEvent.click(expandButton);
        expect(await screen.findByText('Export data')).toBeInTheDocument();

        // Collapse
        fireEvent.click(expandButton);
        expect(screen.queryByText('Export data')).not.toBeInTheDocument();
      });
    });

    describe('User Menu', () => {
      it('opens user menu for anonymous user', async () => {
        const user = userEvent.setup();
        renderSidebar(mockUsers.anonymous);

        const userButton = screen.getByText('Anonymous');
        await user.click(userButton);

        expect(screen.getByText('logout.title')).toBeInTheDocument();
      });

      it('opens user menu for administrator', async () => {
        const user = userEvent.setup();
        renderSidebar(mockUsers.admin);

        const userButton = screen.getByText('AdminUser');
        await user.click(userButton);

        expect(screen.getByText('logout.title')).toBeInTheDocument();
      });

      it('opens user menu for operator', async () => {
        const user = userEvent.setup();
        renderSidebar(mockUsers.operator);

        const userButton = screen.getByText('OperatorUser');
        await user.click(userButton);

        expect(screen.getByText('logout.title')).toBeInTheDocument();
      });

      it('shows logout confirmation dialog when "Sign out" is clicked', async () => {
        const user = userEvent.setup();
        renderSidebar(mockUsers.admin);

        const userButton = screen.getByText('AdminUser');
        await user.click(userButton);

        const signOutButton = screen.getByText('logout.title');
        await user.click(signOutButton);

        expect(screen.getByText('logout.description')).toBeInTheDocument();
        expect(screen.getByText('logout.submit')).toBeInTheDocument();
      });

      it('calls logout function when confirmed', async () => {
        const user = userEvent.setup();
        renderSidebar(mockUsers.admin);

        const userButton = screen.getByText('AdminUser');
        await user.click(userButton);

        const signOutButton = screen.getByText('logout.title');
        await user.click(signOutButton);

        const confirmButton = screen.getByText('logout.submit');
        await user.click(confirmButton);

        expect(mockAuthState.logout).toHaveBeenCalled();
      });

      it('does not call logout function when canceled', async () => {
        const user = userEvent.setup();
        renderSidebar(mockUsers.admin);

        const userButton = screen.getByText('AdminUser');
        await user.click(userButton);

        const signOutButton = screen.getByText('logout.title');
        await user.click(signOutButton);

        const cancelButton = screen.getByText('cancel');
        await user.click(cancelButton);

        expect(mockAuthState.logout).not.toHaveBeenCalled();
      });
    });
  });

  describe('Environment-specific Behavior', () => {
    it('shows local workspaces when in ACIC environment', async () => {
      const user = userEvent.setup();
      Object.defineProperty(window, 'location', {
        value: { hostname: '192.168.20.44' },
        writable: true,
      });

      renderSidebar();
      const workspaceButton = screen.getByRole('button', {
        name: 'selectWorkspace',
      });
      await user.click(workspaceButton);

      await screen.findByRole('menuitem', { name: /localhost:5173/i });
      await screen.findByRole('menuitem', { name: /192\.168\.20\.44/i });
    });

    it('shows only current hostname when not in ACIC environment', async () => {
      const user = userEvent.setup();
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      });

      renderSidebar();
      const workspaceButton = screen.getByRole('button', {
        name: 'selectWorkspace',
      });
      await user.click(workspaceButton);

      await screen.findByRole('menuitem', { name: /example\.com/i });
      expect(
        screen.queryByRole('menuitem', { name: /192\.168\.20\.44/i })
      ).not.toBeInTheDocument();
    });
  });
});
