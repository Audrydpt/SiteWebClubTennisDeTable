import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CollapsedSidebarLayout from './CollapsedSidebarLayout';

// Mock child components to isolate the layout
vi.mock('@/components/app-sidebar', () => ({
  default: () => <div data-testid="app-sidebar">AppSidebar</div>,
}));
vi.mock('@/components/tailwind-size', () => ({
  default: () => <div data-testid="tailwind-indicator">TailwindIndicator</div>,
}));

// Store original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

describe('CollapsedSidebarLayout', () => {
  const mockOnSidebarOpenChange = vi.fn();

  const renderComponent = (props = {}, initialEntries = ['/']) => {
    const defaultProps = {
      sidebarOpen: false,
      onSidebarOpenChange: mockOnSidebarOpenChange,
      ...props,
    };

    // Use the actual SidebarProvider for context testing
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <SidebarProvider
          open={defaultProps.sidebarOpen}
          onOpenChange={defaultProps.onSidebarOpenChange}
        >
          <Routes>
            <Route
              path="/"
              element={
                <CollapsedSidebarLayout {...defaultProps}>
                  {/* Outlet content */}
                </CollapsedSidebarLayout>
              }
            >
              <Route index element={<div>Child Content</div>} />
            </Route>
          </Routes>
        </SidebarProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset NODE_ENV before each test
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterEach(() => {
    // Restore NODE_ENV after each test
    process.env.NODE_ENV = originalNodeEnv;
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
      const header = screen.getByRole('banner'); // The header element
      expect(header).toBeInTheDocument();
      // SidebarTrigger is a button within the header
      const trigger = within(header).getByRole('button');
      expect(trigger).toBeInTheDocument();
    });

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

  describe('Interaction Tests', () => {
    it('should call onSidebarOpenChange when SidebarTrigger is clicked', () => {
      const { rerender } = renderComponent({ sidebarOpen: false });
      const header = screen.getByRole('banner');
      const trigger = within(header).getByRole('button');

      fireEvent.click(trigger);

      // The SidebarProvider's onOpenChange should be called, which is our mock function
      expect(mockOnSidebarOpenChange).toHaveBeenCalledTimes(1);
      // It should be called with the opposite of the current 'open' state
      expect(mockOnSidebarOpenChange).toHaveBeenCalledWith(true);

      // Simulate the parent component updating the state
      rerender(
        <MemoryRouter initialEntries={['/']}>
          <SidebarProvider open onOpenChange={mockOnSidebarOpenChange}>
            <Routes>
              <Route
                path="/"
                element={
                  <CollapsedSidebarLayout
                    sidebarOpen
                    onSidebarOpenChange={mockOnSidebarOpenChange}
                  />
                }
              >
                <Route index element={<div>Child Content</div>} />
              </Route>
            </Routes>
          </SidebarProvider>
        </MemoryRouter>
      );

      // Click again to close
      fireEvent.click(trigger);
      expect(mockOnSidebarOpenChange).toHaveBeenCalledTimes(2);
      expect(mockOnSidebarOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Props Handling', () => {
    it('should reflect the initial sidebarOpen state (via SidebarProvider)', () => {
      // Render with sidebar initially open
      renderComponent({ sidebarOpen: true });

      // How to verify this? The 'open' state is managed internally by SidebarProvider
      // and affects styles/classes. We can test the trigger interaction reflects the initial state.
      const header = screen.getByRole('banner');
      const trigger = within(header).getByRole('button');

      fireEvent.click(trigger);
      // Since it started open (true), clicking should trigger closing (false)
      expect(mockOnSidebarOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onSidebarOpenChange gracefully (if possible)', () => {
      // Note: PropTypes or TypeScript should ideally enforce this prop.
      // Rendering without it might cause runtime errors if the component relies on it.
      // We test if it *renders* without crashing. Interaction might fail.
      expect(() =>
        renderComponent({ onSidebarOpenChange: undefined })
      ).not.toThrow();

      // Interaction test (optional, might fail as expected)
      const header = screen.getByRole('banner');
      const trigger = within(header).getByRole('button');
      // Clicking might throw if the handler is directly called and is undefined
      // Or it might do nothing if SidebarProvider handles undefined gracefully.
      expect(() => fireEvent.click(trigger)).not.toThrow(); // Check it doesn't crash
      // We don't expect the mock to be called here.
      expect(mockOnSidebarOpenChange).not.toHaveBeenCalled();
    });
  });
});
