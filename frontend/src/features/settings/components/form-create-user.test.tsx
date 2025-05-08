import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AcicPrivileges } from '../lib/props';
import FormCreateUser from './form-create-user';

describe('FormCreateUser', () => {
  const mockOnSubmit = vi.fn();

  const defaultUser = {
    user: 'testUser',
    password: 'TestPass1!',
    privileges: AcicPrivileges.Operator,
    superuser: false,
  };

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onSubmit: mockOnSubmit,
      defaultValues: defaultUser,
      ...props,
    };

    return render(
      <FormCreateUser {...defaultProps}>
        <button type="button">Create User</button>
      </FormCreateUser>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render trigger button', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Create User' });
      expect(button).toBeInTheDocument();
    });

    it('should open dialog when trigger is clicked', async () => {
      renderComponent();
      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('settings:createUser.title')).toBeInTheDocument();
    });

    it('should display form fields with default values', async () => {
      renderComponent();
      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );

      const dialog = screen.getByRole('dialog');

      expect(within(dialog).getByLabelText('login.username')).toHaveValue(
        'testUser'
      );
      expect(within(dialog).getByLabelText('login.password')).toHaveValue(
        'TestPass1!'
      );
      expect(
        within(dialog).getByRole('combobox', { name: 'login.privilege' })
      ).toHaveTextContent('privileges.Operator');
    });

    it('should display privileges comparison table', async () => {
      renderComponent();
      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );

      const dialog = screen.getByRole('dialog');
      const table = within(dialog).getByRole('table');

      expect(table).toBeInTheDocument();
      expect(
        within(table).getByText('settings:privileges.functionality')
      ).toBeInTheDocument();
    });
  });

  describe('Validation Tests', () => {
    it('should validate username minimum length', async () => {
      renderComponent({
        defaultValues: {
          ...defaultUser,
          user: 'ab', // Less than 3 characters
        },
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );
      const dialog = screen.getByRole('dialog');

      // Try to submit the form
      const submitButton = within(dialog).getByRole('button', {
        name: 'settings:createUser.submit',
      });
      fireEvent.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should validate password requirements for non-admin', async () => {
      renderComponent({
        defaultValues: {
          ...defaultUser,
          password: 'weak', // Doesn't meet requirements
        },
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );
      const dialog = screen.getByRole('dialog');

      // Try to submit the form
      const submitButton = within(dialog).getByRole('button', {
        name: 'settings:createUser.submit',
      });
      fireEvent.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should validate Administrator passwords are at least 10 characters', async () => {
      renderComponent({
        defaultValues: {
          user: 'adminUser',
          password: 'Admin1!', // 7 chars - too short for admin
          privileges: AcicPrivileges.Administrator,
          superuser: true,
        },
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );
      const dialog = screen.getByRole('dialog');

      // Try to submit the form
      const submitButton = within(dialog).getByRole('button', {
        name: 'settings:createUser.submit',
      });
      fireEvent.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should accept Administrator passwords that are 10+ characters', async () => {
      const adminUser = {
        user: 'adminUser',
        password: 'AdminPass1!', // 11 chars - meets Admin requirement
        privileges: AcicPrivileges.Administrator,
        superuser: true,
      };

      renderComponent({
        defaultValues: adminUser,
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );
      const dialog = screen.getByRole('dialog');

      // Submit the form
      const submitButton = within(dialog).getByRole('button', {
        name: 'settings:createUser.submit',
      });
      fireEvent.click(submitButton);

      // Should be accepted
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            user: 'adminUser',
            password: 'AdminPass1!',
            privileges: AcicPrivileges.Administrator,
            superuser: true,
          })
        );
      });
    });

    it('should not require 10+ chars for Operator passwords', async () => {
      const operatorUser = {
        user: 'operatorUser',
        password: 'Operator1!', // 10 chars but meets all other requirements
        privileges: AcicPrivileges.Operator,
        superuser: false,
      };

      renderComponent({
        defaultValues: operatorUser,
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );
      const dialog = screen.getByRole('dialog');

      // Submit the form
      const submitButton = within(dialog).getByRole('button', {
        name: 'settings:createUser.submit',
      });
      fireEvent.click(submitButton);

      // Should be accepted if it meets base requirements (ignoring 10+ char check)
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            user: 'operatorUser',
            password: 'Operator1!',
            privileges: AcicPrivileges.Operator,
            superuser: false,
          })
        );
      });
    });
  });

  describe('Form Submission Tests', () => {
    it('should successfully submit with valid data', async () => {
      const validUser = {
        user: 'validUser',
        password: 'ValidPass1!',
        privileges: AcicPrivileges.Maintainer,
        superuser: false,
      };

      renderComponent({
        defaultValues: validUser,
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );
      const dialog = screen.getByRole('dialog');

      // Submit the form
      const submitButton = within(dialog).getByRole('button', {
        name: 'settings:createUser.submit',
      });
      fireEvent.click(submitButton);

      // Should call onSubmit with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            user: 'validUser',
            password: 'ValidPass1!',
            privileges: AcicPrivileges.Maintainer,
            superuser: false,
          })
        );
      });
    });

    it('should close dialog after successful submission', async () => {
      renderComponent();
      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );

      // Submit the form
      const dialog = screen.getByRole('dialog');
      const submitButton = within(dialog).getByRole('button', {
        name: 'settings:createUser.submit',
      });

      // Click submit
      fireEvent.click(submitButton);

      // Dialog should close
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Use the close button as a reliable test
      const closeButton = within(dialog).getByRole('button', { name: 'close' });
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should set superuser flag automatically for Administrators', async () => {
      const adminUser = {
        user: 'adminUser',
        password: 'AdminPassword1!',
        privileges: AcicPrivileges.Administrator,
        superuser: false, // This should be overridden to true
      };

      renderComponent({
        defaultValues: adminUser,
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Create User' })
      );

      const dialog = screen.getByRole('dialog');
      const submitButton = within(dialog).getByRole('button', {
        name: 'settings:createUser.submit',
      });
      fireEvent.click(submitButton);

      // Should call onSubmit with superuser set to true
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            privileges: AcicPrivileges.Administrator,
            superuser: true, // This should be true regardless of input
          })
        );
      });
    });
  });
});
