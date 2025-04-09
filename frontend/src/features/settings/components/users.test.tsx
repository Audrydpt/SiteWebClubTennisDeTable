import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UserPrivileges } from '@/lib/authenticate';
import useUsersAPI from '../hooks/use-users';
import Users from './users';

vi.mock('../hooks/use-users');

describe('Users Component', () => {
  const mockHook = {
    query: {
      isLoading: false,
      isError: false,
      data: [
        { user: 'testUser1', privileges: UserPrivileges.Administrator },
        { user: 'testUser2', privileges: UserPrivileges.Maintainer },
      ],
    },
    getAll: () => mockHook.query.data,
    insert: vi.fn(),
    edit: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    (useUsersAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);
  });

  const renderComponent = (props = {}) => render(<Users {...props} />);

  describe('Basic Rendering', () => {
    it('should render user list', () => {
      renderComponent();
      expect(screen.getByText('testUser1')).toBeInTheDocument();
      expect(screen.getByText('testUser2')).toBeInTheDocument();
    });

    it('should render add user button', () => {
      renderComponent();
      expect(screen.getByText('settings:addUser')).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('should open create user dialog', async () => {
      renderComponent();
      await userEvent.click(screen.getByText('settings:addUser'));
      expect(screen.getByText('settings:createUser.title')).toBeInTheDocument();
    });

    it('should create a new user', async () => {
      renderComponent();
      await userEvent.click(screen.getByText('settings:addUser'));

      await userEvent.type(screen.getByLabelText('login.username'), 'newUser');
      await userEvent.type(
        screen.getByLabelText('login.password'),
        'AcicAcic1-'
      );

      await userEvent.click(
        screen.getByRole('combobox', { name: 'login.privilege' })
      );

      const elem = screen.getByRole('option', {
        name: 'privileges.Maintainer',
      });
      await userEvent.click(elem, {
        pointerState: await userEvent.pointer({ target: elem }),
      });

      await userEvent.click(screen.getByText('settings:createUser.submit'));
      fireEvent.click(screen.getByText('settings:createUser.submit'));

      await waitFor(() => {
        expect(mockHook.insert).toHaveBeenCalled();
      });
    });

    it('should delete a user', async () => {
      renderComponent();
      await userEvent.click(screen.getAllByLabelText('Delete')[0]);

      const dialog = screen.getByRole('alertdialog');
      within(dialog).getByRole('button', { name: 'delete' }).click();

      expect(mockHook.remove).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user list', () => {
      const emptyMockHook = {
        ...mockHook,
        query: {
          ...mockHook.query,
          data: [],
        },
        getAll: () => [],
      };
      (useUsersAPI as ReturnType<typeof vi.fn>).mockReturnValue(emptyMockHook);

      renderComponent();
      expect(screen.queryByText('testUser1')).not.toBeInTheDocument();
      expect(screen.queryByText('testUser2')).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(
        screen.queryByRole('row', { name: /testUser/ })
      ).not.toBeInTheDocument();
    });

    it('should handle loading state', () => {
      const loadingMockHook = {
        ...mockHook,
        query: {
          ...mockHook.query,
          isLoading: true,
        },
      };
      (useUsersAPI as ReturnType<typeof vi.fn>).mockReturnValue(
        loadingMockHook
      );

      renderComponent();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('testUser1')).not.toBeInTheDocument();
    });

    it('should handle error state', () => {
      const errorMockHook = {
        ...mockHook,
        query: {
          ...mockHook.query,
          isError: true,
        },
      };
      (useUsersAPI as ReturnType<typeof vi.fn>).mockReturnValue(errorMockHook);

      renderComponent();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('testUser1')).not.toBeInTheDocument();
    });
  });
});
