import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SidebarProvider } from '@/components/ui/sidebar';
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

// Simuler l'environnement de développement
const originalEnv = process.env.NODE_ENV;
vi.stubEnv('NODE_ENV', 'development');

const renderSidebar = (props = {}) =>
  render(
    <BrowserRouter>
      <SidebarProvider open>
        <AppSidebar {...props} />
      </SidebarProvider>
    </BrowserRouter>
  );

describe('AppSidebar', () => {
  describe('Basic Rendering', () => {
    it('renders the logo', () => {
      renderSidebar();
      const logo = screen.getByRole('img', { name: /acic/i });
      expect(logo).toBeInTheDocument();
    });

    it('renders main navigation items', () => {
      renderSidebar();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Maps')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders section labels', () => {
      renderSidebar();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Configurations')).toBeInTheDocument();
    });
  });

  describe('User Menu', () => {
    it('shows anonymous when no user provided', () => {
      renderSidebar();
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });

    it('shows username when user is provided', () => {
      renderSidebar({ user: { user: 'TestUser' } });
      expect(screen.getByText('TestUser')).toBeInTheDocument();
    });
  });

  describe('Workspaces', () => {
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

      // Wait for workspaces to appear
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

    it('navigates to workspaces with correct protocol', async () => {
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

      await user.click(workspaceButton);
      const ipOption = await screen.findByRole('menuitem', {
        name: /192\.168\.20\.150/i,
      });
      await user.click(ipOption);
      expect(hrefValue).toBe('https://192.168.20.150/front-react/');
    });
  });

  describe('Menu Items with Children', () => {
    beforeAll(() => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: '192.168.20.44',
        },
        writable: true,
      });
    });

    it('shows test items after clicking on expand button', async () => {
      renderSidebar();

      // D'abord on ne devrait pas voir les éléments enfants
      expect(screen.queryByText('All widgets')).not.toBeInTheDocument();

      const dashboardMenuItem = screen.getByText('Dashboard').closest('li');
      if (!dashboardMenuItem)
        throw new Error('Could not find dashboard menu item');

      const chevronButton = dashboardMenuItem.querySelector('button svg');
      if (!chevronButton) throw new Error('Could not find chevron button');

      // Cliquer sur le bouton d'expansion
      const buttonElement = chevronButton.closest('button');
      if (!buttonElement) throw new Error('Could not find button element');

      fireEvent.click(buttonElement);

      // Maintenant on devrait voir les éléments enfants
      expect(await screen.findByText('All widgets')).toBeInTheDocument();
      expect(screen.getByText('Main dahsboard')).toBeInTheDocument();
      expect(screen.getByText('Demo dahsboard')).toBeInTheDocument();
    });
  });
});

// Cleanup after all tests
afterAll(() => {
  process.env.NODE_ENV = originalEnv;
});
