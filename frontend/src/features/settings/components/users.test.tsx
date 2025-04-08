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

  it('should render user list', () => {
    render(<Users />);
    expect(screen.getByText('testUser1')).toBeInTheDocument();
    expect(screen.getByText('testUser2')).toBeInTheDocument();
  });

  it('should open create user dialog', async () => {
    render(<Users />);
    await userEvent.click(screen.getByText('settings:addUser'));
    expect(screen.getByText('settings:createUser.title')).toBeInTheDocument();
  });

  it('should create a new user', async () => {
    render(<Users />);
    await userEvent.click(screen.getByText('settings:addUser'));
    expect(screen.getByText('settings:createUser.title')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('login.username'), 'newUser');
    await userEvent.type(screen.getByLabelText('login.password'), 'AcicAcic1-');

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
    render(<Users />);

    await userEvent.click(screen.getAllByLabelText('Delete')[0]);

    const dialog = screen.getByRole('alertdialog');
    within(dialog).getByRole('button', { name: 'delete' }).click();

    expect(mockHook.remove).toHaveBeenCalled();
  });
});
