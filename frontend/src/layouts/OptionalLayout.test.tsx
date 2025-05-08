import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/providers/auth-context';

import OptionalSidebarLayout from './OptionalLayout';

// Mock the auth context
vi.mock('@/providers/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mock the child layouts
vi.mock('@/layouts/SidebarLayout', () => ({
  default: ({ sidebarOpen }: { sidebarOpen: boolean }) => (
    <div data-testid="sidebar-layout" data-open={sidebarOpen}>
      SidebarLayout
    </div>
  ),
}));

vi.mock('@/layouts/NoSidebarLayout', () => ({
  default: () => <div data-testid="no-sidebar-layout">NoSidebarLayout</div>,
}));

describe('OptionalSidebarLayout', () => {
  const mockOnSidebarOpenChange = vi.fn();
  const defaultProps = {
    sidebarOpen: false,
    onSidebarOpenChange: mockOnSidebarOpenChange,
  };

  const renderComponent = (props = {}, initialEntries = ['/']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="/"
            element={<OptionalSidebarLayout {...defaultProps} {...props} />}
          >
            <Route index element={<div>Child Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render nothing when loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: true,
      });

      renderComponent();
      expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-layout')).not.toBeInTheDocument();
      expect(screen.queryByTestId('no-sidebar-layout')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    it('should render SidebarLayout for authenticated non-anonymous user', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { privileges: 'Admin' },
        isLoading: false,
      });

      renderComponent();
      expect(screen.getByTestId('sidebar-layout')).toBeInTheDocument();
      expect(screen.queryByTestId('no-sidebar-layout')).not.toBeInTheDocument();
    });

    it('should pass sidebarOpen prop to SidebarLayout', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { privileges: 'Admin' },
        isLoading: false,
      });

      renderComponent({ sidebarOpen: true });
      const sidebarLayout = screen.getByTestId('sidebar-layout');
      expect(sidebarLayout).toHaveAttribute('data-open', 'true');
    });
  });

  describe('Unauthenticated or Anonymous User', () => {
    it('should render NoSidebarLayout for unauthenticated user', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
      });

      renderComponent();
      expect(screen.getByTestId('no-sidebar-layout')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-layout')).not.toBeInTheDocument();
    });

    it('should render NoSidebarLayout for anonymous user', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { privileges: 'Anonymous' },
        isLoading: false,
      });

      renderComponent();
      expect(screen.getByTestId('no-sidebar-layout')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-layout')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should pass sidebarOpen and onSidebarOpenChange to SidebarLayout when authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { privileges: 'Admin' },
        isLoading: false,
      });

      renderComponent({ sidebarOpen: true });
      const sidebarLayout = screen.getByTestId('sidebar-layout');
      expect(sidebarLayout).toHaveAttribute('data-open', 'true');
    });
  });
});
