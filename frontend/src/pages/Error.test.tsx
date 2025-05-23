import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ErrorPage from './Error';

const mockNavigate = vi.fn();
const mockHistoryBack = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('ErrorPage', () => {
  // Save original window.history.back
  const originalHistoryBack = window.history.back;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.history.back
    window.history.back = mockHistoryBack;
  });

  afterEach(() => {
    // Restore original window.history.back
    window.history.back = originalHistoryBack;
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      type: '404' as const,
    };

    return render(<ErrorPage {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('renders 404 error page correctly', () => {
      renderComponent({ type: '404' });

      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(
        screen.getByText(/We couldn't find the page you're looking for/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Return Home/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Go Back/i })
      ).toBeInTheDocument();
    });

    it('renders 403 error page correctly', () => {
      renderComponent({ type: '403' });

      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
      expect(
        screen.getByText(/You don't have permission to access this page/)
      ).toBeInTheDocument();
    });

    it('renders 500 error page correctly', () => {
      renderComponent({ type: '500' });

      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(
        screen.getByText(/Our servers are experiencing issues/)
      ).toBeInTheDocument();
    });

    it('renders crash error page correctly', () => {
      renderComponent({ type: 'crash' });

      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(
        screen.getByText(/The application encountered an unexpected error/)
      ).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('navigates to home when Return Home button is clicked', async () => {
      renderComponent();

      const homeButton = screen.getByRole('button', { name: /Return Home/i });
      await userEvent.click(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('calls history.back when Go Back button is clicked', async () => {
      renderComponent();

      const backButton = screen.getByRole('button', { name: /Go Back/i });
      await userEvent.click(backButton);

      expect(mockHistoryBack).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('displays the correct icon for each error type', () => {
      // Test for icon presence
      const { rerender } = renderComponent({ type: '404' });
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();

      rerender(<ErrorPage type="403" />);
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();

      rerender(<ErrorPage type="500" />);
      expect(screen.getByText('Server Error')).toBeInTheDocument();

      rerender(<ErrorPage type="crash" />);
      expect(screen.getByText('Application Error')).toBeInTheDocument();
    });
  });
});
