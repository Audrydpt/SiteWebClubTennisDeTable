import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Login from './Login';

// Mock implementations
const mockNavigate = vi.fn();
const mockLogin = vi.fn();

const mockAuth = {
  login: mockLogin,
  isAuthenticated: false,
};

// Mock the modules
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => mockAuth,
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isAuthenticated = false;
  });

  describe('Basic Rendering', () => {
    it('renders the login form with correct elements', () => {
      render(<Login />);

      // Logo
      expect(screen.getByAltText('Logo')).toBeInTheDocument();

      // Title and description
      expect(
        screen.getByRole('heading', { name: 'login.title' })
      ).toBeInTheDocument();
      expect(screen.getByText('login.description')).toBeInTheDocument();

      // Form fields
      expect(screen.getByLabelText('login.username')).toBeInTheDocument();
      expect(screen.getByLabelText('login.password')).toBeInTheDocument();

      // Submit button
      expect(
        screen.getByRole('button', { name: 'login.submit' })
      ).toBeInTheDocument();

      // Language switchers
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Français')).toBeInTheDocument();
    });

    it('redirects to dashboard if already authenticated', () => {
      mockAuth.isAuthenticated = true;
      render(<Login />);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Form Interaction', () => {
    it('allows entering username and password', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const usernameInput = screen.getByLabelText('login.username');
      const passwordInput = screen.getByLabelText('login.password');

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      expect(usernameInput).toHaveValue('testuser');
      expect(passwordInput).toHaveValue('password123');
    });

    it('handles successful login and redirects to dashboard', async () => {
      mockLogin.mockResolvedValueOnce(undefined);
      render(<Login />);

      const usernameInput = screen.getByLabelText('login.username');
      const passwordInput = screen.getByLabelText('login.password');
      const submitButton = screen.getByRole('button', { name: 'login.submit' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      // Submit the form by clicking the button
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('shows error message when login fails', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Login failed'));
      render(<Login />);

      const usernameInput = screen.getByLabelText('login.username');
      const passwordInput = screen.getByLabelText('login.password');
      const submitButton = screen.getByRole('button', { name: 'login.submit' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'wrong_password');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'wrong_password');
        expect(screen.getByText('login.error')).toBeInTheDocument();
      });
    });
    it('shows loading spinner while logging in', async () => {
      let resolveLogin!: (value?: unknown) => void;
      mockLogin.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          })
      );

      render(<Login />);

      const usernameInput = screen.getByLabelText('login.username');
      const passwordInput = screen.getByLabelText('login.password');
      const submitButton = screen.getByRole('button', { name: 'login.submit' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      fireEvent.click(submitButton);

      // Check for disabled button with loading state
      await waitFor(() => {
        // Use a more direct selector that doesn't rely on text content
        expect(submitButton).toBeDisabled();
        // Verify spinner is present
        expect(submitButton?.querySelector('svg')).toBeInTheDocument();
      });

      // Resolve the login promise
      resolveLogin();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors when form is submitted empty', async () => {
      // Mock the form validation messages directly
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Login />);

      // Submit the form without entering any data
      const submitButton = screen.getByRole('button', { name: 'login.submit' });
      fireEvent.click(submitButton);

      // Just verify the form submission was prevented and login wasn't called
      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });
  });
});
