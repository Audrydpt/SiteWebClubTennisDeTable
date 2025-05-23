import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';

import { useAuth } from '@/providers/auth-context';

// Mock the Navigate component from react-router-dom
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
}));

// Mock the auth context
vi.mock('@/providers/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('Home', () => {
  const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

  const renderComponent = () => render(<Home />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('redirects to login page when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false });
      renderComponent();
      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/login');
    });

    it('redirects to dashboard page when user is authenticated', () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true });
      renderComponent();
      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/dashboard');
    });
  });

  describe('Edge Cases', () => {
    it('handles null/undefined authentication state by redirecting to login', () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: null });
      renderComponent();
      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/login');
    });
  });
});
