import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { UserPrivileges } from '@/lib/authenticate';
import * as AuthContext from '@/providers/auth-context';
import ProtectedRoute from './protected-routes';

vi.mock('@/providers/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  const renderComponent = (props = {}, authProps = {}) => {
    const defaultAuthProps = {
      user: { user: 'testuser', privileges: UserPrivileges.Operator },
      isLoading: false,
      isAuthenticated: true,
    };

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      ...defaultAuthProps,
      ...authProps,
      login: vi.fn(),
      logout: vi.fn(),
    });

    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute {...props} />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Basic Rendering', () => {
    it('renders the outlet when user has sufficient privileges', () => {
      renderComponent(
        { role: UserPrivileges.Operator },
        { user: { user: 'testuser', privileges: UserPrivileges.Operator } }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders the outlet when user has higher privileges than required', () => {
      renderComponent(
        { role: UserPrivileges.Operator },
        { user: { user: 'testuser', privileges: UserPrivileges.Administrator } }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to login when user has insufficient privileges', () => {
      renderComponent(
        { role: UserPrivileges.Administrator },
        { user: { user: 'testuser', privileges: UserPrivileges.Operator } }
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('uses Anonymous as default role when not specified', () => {
      renderComponent(
        {},
        { user: { user: 'testuser', privileges: UserPrivileges.Anonymous } }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('does not redirect while loading', () => {
      renderComponent(
        { role: UserPrivileges.Administrator },
        {
          user: { user: 'testuser', privileges: UserPrivileges.Operator },
          isLoading: true,
        }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles Anonymous user correctly', () => {
      renderComponent(
        { role: UserPrivileges.Operator },
        { user: { user: '', privileges: UserPrivileges.Anonymous } }
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
