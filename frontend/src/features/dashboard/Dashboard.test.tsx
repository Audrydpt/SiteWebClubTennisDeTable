import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Dashboard from './Dashboard';
import useDashboardAPI from './hooks/use-dashboard';

// Mock the custom hook
vi.mock('./hooks/use-dashboard', () => ({
  default: vi.fn(),
}));

// Mock only child dashboard components
vi.mock('./DashboardTab', () => ({
  default: ({ dashboardKey }: { dashboardKey: string }) => (
    <div data-testid={`dashboard-tab-${dashboardKey}`}>Dashboard Tab Mock</div>
  ),
}));

vi.mock('./TestDashboard', () => ({
  default: () => <div data-testid="test-dashboard">Test Dashboard Mock</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard', () => {
  const mockData = {
    'dashboard-1': { id: 'dashboard-1', title: 'Main Dashboard', widgets: [] },
    'dashboard-2': {
      id: 'dashboard-2',
      title: 'Secondary Dashboard',
      widgets: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  describe('Loading States', () => {
    it('should show loading spinner when data is loading', () => {
      const mockHook = {
        query: { isLoading: true, isError: false, data: null },
        add: vi.fn(),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should show error message when there is an error', () => {
      const mockHook = {
        query: { isLoading: false, isError: true, data: null },
        add: vi.fn(),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Header and Dashboard Content', () => {
    it('should render header with correct title and action buttons', () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockData },
        add: vi.fn(),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      // Test for actual Header content
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'dashboard:dashboard.add' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'dashboard:widget.add' })
      ).toBeInTheDocument();
    });

    it('should render all dashboard tabs', () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockData },
        add: vi.fn(),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getByText('Main Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Secondary Dashboard')).toBeInTheDocument();
    });
  });

  describe('Dashboard Actions', () => {
    it('should open add dashboard dialog when button is clicked', async () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockData },
        add: vi.fn(),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      const addButton = screen.getByText('dashboard:dashboard.add');
      await userEvent.click(addButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should open delete confirmation when delete button is clicked', async () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockData },
        add: vi.fn(),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter initialEntries={['/dashboard-2']}>
          <Routes>
            <Route path="/:dashboardId?" element={<Dashboard />} />
          </Routes>
        </MemoryRouter>
      );

      const secondaryTab = screen.getByRole('tab', {
        name: /Secondary Dashboard/i,
      });
      await userEvent.hover(secondaryTab);

      const deleteButton = await within(secondaryTab).findByRole('button');
      await userEvent.click(deleteButton);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should add a new dashboard and navigate', async () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockData },
        add: vi.fn().mockResolvedValue({ id: 'new-id' }),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      const addTrigger = screen.getByText('dashboard:dashboard.add');
      await userEvent.click(addTrigger);

      const dialog = screen.getByRole('dialog');
      const titleInput = within(dialog).getByRole('textbox');
      await userEvent.type(titleInput, 'New Dashboard');

      const form = dialog.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockHook.add).toHaveBeenCalledWith({ title: 'New Dashboard' });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/new-id');
      });
    });

    it('should delete a dashboard and navigate', async () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockData },
        add: vi.fn(),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter initialEntries={['/dashboard-2']}>
          <Routes>
            <Route path="/:dashboardId?" element={<Dashboard />} />
          </Routes>
        </MemoryRouter>
      );

      const secondaryTab = screen.getByRole('tab', {
        name: /Secondary Dashboard/i,
      });
      await userEvent.hover(secondaryTab);

      const deleteButton = await within(secondaryTab).findByRole('button');
      await userEvent.click(deleteButton);

      const dialog = screen.getByRole('alertdialog');
      const confirmButton = within(dialog).getByRole('button', {
        name: 'delete',
      });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockHook.remove).toHaveBeenCalledWith('dashboard-2');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Navigation', () => {
    it('should select first dashboard when no dashboardId is provided', () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockData },
        add: vi.fn(),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(
        screen.getByTestId('dashboard-tab-dashboard-1')
      ).toBeInTheDocument();
    });

    it('should navigate when tab is changed', async () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockData },
        add: vi.fn(),
        remove: vi.fn(),
      };
      (useDashboardAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      const secondaryTab = screen.getByRole('tab', {
        name: /Secondary Dashboard/i,
      });
      await userEvent.click(secondaryTab);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/dashboard-2');
    });
  });
});
