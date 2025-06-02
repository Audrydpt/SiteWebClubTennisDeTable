import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SidebarLayout from './SidebarLayout';

// Mock child components
vi.mock('@/components/app-sidebar', () => ({
  default: () => <div data-testid="app-sidebar">AppSidebar</div>,
}));

vi.mock('@/components/tailwind-size', () => ({
  default: () => <div data-testid="tailwind-indicator">TailwindIndicator</div>,
}));

describe('SidebarLayout', () => {
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
            element={<SidebarLayout {...defaultProps} {...props} />}
          >
            <Route index element={<div>Child Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset NODE_ENV before each test
    process.env.NODE_ENV = 'test';
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render AppSidebar', () => {
      renderComponent();
      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    });

    it('should render Outlet content', () => {
      renderComponent();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render the header with SidebarTrigger', () => {
      renderComponent();
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      const trigger = within(header).getByRole('button');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('data-sidebar', 'trigger');
    });

    it('should have correct container classes', () => {
      renderComponent();
      const container = screen.getByText('Child Content').parentElement;
      expect(container).toHaveClass('mx-auto');
      expect(container).toHaveClass('max-w-6xl');
      expect(container).toHaveClass('h-full');
      expect(container).toHaveClass('w-full');
      expect(container).toHaveClass('gap-6');
      expect(container).toHaveClass('p-6');
      expect(container).toHaveClass('sm:p-8');
    });
  });

  describe('Sidebar State', () => {
    it('should pass sidebarOpen state to SidebarProvider', () => {
      renderComponent({ sidebarOpen: true });
      // Check if the sidebar wrapper has the correct styling when open
      const sidebarWrapper = document.querySelector('.group\\/sidebar-wrapper');
      expect(sidebarWrapper).toBeInTheDocument();
    });

    it('should pass onSidebarOpenChange to SidebarProvider', () => {
      renderComponent();
      const trigger = screen.getByRole('button', { name: /toggle sidebar/i });
      fireEvent.click(trigger);
      expect(mockOnSidebarOpenChange).toHaveBeenCalled();
    });
  });

  describe('Development Mode', () => {
    it('should render TailwindSizeIndicator in development mode', () => {
      process.env.NODE_ENV = 'development';
      renderComponent();
      expect(screen.getByTestId('tailwind-indicator')).toBeInTheDocument();
    });

    it('should NOT render TailwindSizeIndicator in production mode', () => {
      process.env.NODE_ENV = 'production';
      renderComponent();
      expect(
        screen.queryByTestId('tailwind-indicator')
      ).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have correct header classes for mobile', () => {
      renderComponent();
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('md:hidden');
      expect(header).toHaveClass('h-14');
      expect(header).toHaveClass('px-4');
    });
  });
});
