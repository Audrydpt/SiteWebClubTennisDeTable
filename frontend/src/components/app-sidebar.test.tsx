import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SidebarProvider } from '@/components/ui/sidebar';
import { UserType } from '@/lib/authenticate';
import AppSidebar from './app-sidebar';

// Mock the logo import
vi.mock('../assets/logo.svg', () => ({
  default: 'mocked-logo.svg',
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
});

const mockUsers: Record<string, UserType> = {
  admin: {
    user: 'AdminUser',
    privileges: 'Administrator',
  },
  operator: {
    user: 'OperatorUser',
    privileges: 'Operator',
  },
};

interface TestProps {
  user?: UserType;
}

const defaultProps: TestProps = {
  user: undefined,
};

const renderSidebar = (props = defaultProps) =>
  render(
    <BrowserRouter>
      <SidebarProvider open>
        <AppSidebar {...props} />
      </SidebarProvider>
    </BrowserRouter>
  );

describe('AppSidebar', () => {
  // Reset mocks and environment before each test
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
  });

  describe('Basic Rendering', () => {
    it('renders with default props (no user)', () => {
      renderSidebar();
      expect(screen.getByRole('img', { name: /acic/i })).toBeInTheDocument();
      expect(screen.getByText('Select Workspace')).toBeInTheDocument();
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });

    it('renders with administrator user', () => {
      renderSidebar({ user: mockUsers.admin });
      expect(screen.getByText('AdminUser')).toBeInTheDocument();
    });

    it('renders with operator user', () => {
      renderSidebar({ user: mockUsers.operator });
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
          name: /select workspace/i,
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
          name: /select workspace/i,
        });
        await user.click(workspaceButton);

        const localhostOption = await screen.findByRole('menuitem', {
          name: /localhost:5173/i,
        });
        await user.click(localhostOption);
        expect(hrefValue).toBe('http://localhost:5173/front-react/');
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

        expect(await screen.findByText('All widgets')).toBeInTheDocument();
        expect(screen.getByText('Main dahsboard')).toBeInTheDocument();
        expect(screen.getByText('Demo dahsboard')).toBeInTheDocument();
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
        expect(await screen.findByText('All widgets')).toBeInTheDocument();

        // Collapse
        fireEvent.click(expandButton);
        expect(screen.queryByText('All widgets')).not.toBeInTheDocument();
      });
    });

    describe('User Menu', () => {
      it('opens user menu for anonymous user', async () => {
        const user = userEvent.setup();
        renderSidebar();

        const userButton = screen.getByText('Anonymous');
        await user.click(userButton);

        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });

      it('opens user menu for administrator', async () => {
        const user = userEvent.setup();
        renderSidebar({ user: mockUsers.admin });

        const userButton = screen.getByText('AdminUser');
        await user.click(userButton);

        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });

      it('opens user menu for operator', async () => {
        const user = userEvent.setup();
        renderSidebar({ user: mockUsers.operator });

        const userButton = screen.getByText('OperatorUser');
        await user.click(userButton);

        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.getByText('Sign out')).toBeInTheDocument();
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
        name: /select workspace/i,
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
        name: /select workspace/i,
      });
      await user.click(workspaceButton);

      await screen.findByRole('menuitem', { name: /example\.com/i });
      expect(
        screen.queryByRole('menuitem', { name: /192\.168\.20\.44/i })
      ).not.toBeInTheDocument();
    });
  });
});
