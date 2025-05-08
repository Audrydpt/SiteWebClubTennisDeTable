import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { toast } from 'sonner';

import useVMSAPI from '../hooks/use-vms';
import VMSSettings from './vms-settings';

// Mock the VMS API hook
vi.mock('../hooks/use-vms');

describe('VMSSettings', () => {
  const mockVMSAPI = {
    query: {
      data: {
        type: 'Milestone' as const,
        ip: '10.0.0.1',
        port: 80,
        username: 'admin',
        password: 'password123',
      },
      isLoading: false,
    },
    describeQuery: {
      data: { success: true }, // Mock describe data structure as needed
      isLoading: false,
      isFetched: true,
    },
    edit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useVMSAPI as jest.Mock).mockReturnValue(mockVMSAPI);
  });

  const renderComponent = () => render(<VMSSettings />);

  describe('Basic Rendering', () => {
    it('should render the component with title and description', () => {
      renderComponent();
      expect(screen.getByText('vms-settings.title')).toBeInTheDocument();
      expect(screen.getByText('vms-settings.description')).toBeInTheDocument();
    });

    it('should render initial form fields (Type, IP, Port)', () => {
      renderComponent();
      expect(
        screen.getByLabelText('vms-settings.selectVMS')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('vms-settings.ipAddress')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('vms-settings.port')).toBeInTheDocument();
    });

    it('should populate form with initial data', async () => {
      renderComponent();
      // Wait for useEffect to populate form
      await waitFor(() => {
        expect(screen.getByDisplayValue('10.0.0.1')).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('80')).toBeInTheDocument();
      // Default value for select is tricky with async population, check if Milestone is selected
      expect(
        screen.getByRole('combobox', { name: 'vms-settings.selectVMS' })
      ).toHaveTextContent('vms-settings.milestone');
    });
  });

  describe('Conditional Rendering (Milestone)', () => {
    it('should render username and password fields when Milestone is selected', async () => {
      // Initial data already has Milestone selected
      renderComponent();
      await waitFor(() => {
        expect(
          screen.getByLabelText('vms-settings.username')
        ).toBeInTheDocument();
      });
      expect(
        screen.getByLabelText('vms-settings.password')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
      expect(screen.getByDisplayValue('password123')).toBeInTheDocument();
    });

    it('should NOT render username and password fields when Genetec is selected', async () => {
      (useVMSAPI as jest.Mock).mockReturnValue({
        ...mockVMSAPI,
        query: {
          ...mockVMSAPI.query,
          data: {
            ...mockVMSAPI.query.data,
            type: 'Genetec' as const,
            username: '', // Ensure these are not present for Genetec
            password: '',
          },
        },
      });
      renderComponent();

      // Change selection to Genetec
      const typeSelect = screen.getByRole('combobox', {
        name: 'vms-settings.selectVMS',
      });
      await userEvent.click(typeSelect);
      const listbox = screen.getByRole('listbox');
      await userEvent.click(within(listbox).getByText('vms-settings.genetec'));

      await waitFor(() => {
        expect(
          screen.queryByLabelText('vms-settings.username')
        ).not.toBeInTheDocument();
        expect(
          screen.queryByLabelText('vms-settings.password')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Connection Status Badge', () => {
    it('should show success badge when connection is successful', () => {
      renderComponent();
      expect(screen.getByText('Connection successful')).toBeInTheDocument();
    });

    it('should show checking status when loading', () => {
      (useVMSAPI as jest.Mock).mockReturnValue({
        ...mockVMSAPI,
        describeQuery: {
          ...mockVMSAPI.describeQuery,
          isLoading: true,
          isFetched: false, // Ensure isFetched is false during loading
          data: null, // No data while loading
        },
      });
      renderComponent();
      expect(screen.getByText('Checking connection...')).toBeInTheDocument();
    });

    it('should show failure badge when connection fails', () => {
      (useVMSAPI as jest.Mock).mockReturnValue({
        ...mockVMSAPI,
        describeQuery: {
          ...mockVMSAPI.describeQuery,
          data: null,
          isLoading: false,
          isFetched: true, // isFetched should be true after attempt
        },
      });
      renderComponent();
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('should show nothing if IP or port is missing/invalid initially', () => {
      (useVMSAPI as jest.Mock).mockReturnValue({
        ...mockVMSAPI,
        query: {
          data: null, // No initial data
          isLoading: false,
        },
        describeQuery: {
          // No describe query should run initially
          data: null,
          isLoading: false,
          isFetched: false,
        },
      });
      renderComponent();
      expect(screen.queryByText(/Connection/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Checking/)).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should handle VMS Type change', async () => {
      renderComponent();
      const typeSelect = screen.getByRole('combobox', {
        name: 'vms-settings.selectVMS',
      });

      // Change to Genetec
      await userEvent.click(typeSelect);
      let listbox = screen.getByRole('listbox');
      await userEvent.click(within(listbox).getByText('vms-settings.genetec'));
      expect(typeSelect).toHaveTextContent('vms-settings.genetec');
      expect(
        screen.queryByLabelText('vms-settings.username')
      ).not.toBeInTheDocument();

      // Change back to Milestone
      await userEvent.click(typeSelect);
      listbox = screen.getByRole('listbox'); // Re-query listbox
      await userEvent.click(
        within(listbox).getByText('vms-settings.milestone')
      );
      expect(typeSelect).toHaveTextContent('vms-settings.milestone');
      expect(
        screen.getByLabelText('vms-settings.username')
      ).toBeInTheDocument();
    });

    it('should handle IP address change', async () => {
      renderComponent();
      const ipInput = screen.getByLabelText('vms-settings.ipAddress');
      await userEvent.clear(ipInput);
      await userEvent.type(ipInput, '192.168.1.200');
      expect(ipInput).toHaveValue('192.168.1.200');
    });

    it('should handle port number change', async () => {
      renderComponent();
      const portInput = screen.getByLabelText('vms-settings.port');
      await userEvent.clear(portInput);
      await userEvent.type(portInput, '9090');
      expect(portInput).toHaveValue(9090);
    });

    it('should handle username change (when Milestone)', async () => {
      renderComponent(); // Defaults to Milestone
      await waitFor(() => {
        // Wait for fields to appear
        expect(
          screen.getByLabelText('vms-settings.username')
        ).toBeInTheDocument();
      });
      const usernameInput = screen.getByLabelText('vms-settings.username');
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'new_user');
      expect(usernameInput).toHaveValue('new_user');
    });

    it('should handle password change (when Milestone)', async () => {
      renderComponent(); // Defaults to Milestone
      await waitFor(() => {
        // Wait for fields to appear
        expect(
          screen.getByLabelText('vms-settings.password')
        ).toBeInTheDocument();
      });
      const passwordInput = screen.getByLabelText('vms-settings.password');
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'new_password');
      expect(passwordInput).toHaveValue('new_password');
    });

    it('should handle form submission for Milestone', async () => {
      mockVMSAPI.edit.mockImplementation((_data, options) => {
        options?.onSuccess?.(); // Optional chaining for safety
        return Promise.resolve();
      });

      const { container } = renderComponent();

      // Wait for form to populate and be ready
      await waitFor(() => {
        expect(screen.getByDisplayValue('10.0.0.1')).toBeInTheDocument();
      });

      // Change some values
      const ipInput = screen.getByLabelText('vms-settings.ipAddress');
      await userEvent.clear(ipInput);
      await userEvent.type(ipInput, '10.0.0.2');

      const usernameInput = screen.getByLabelText('vms-settings.username');
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'updated_user');

      // Find the form and submit
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      if (!form) throw new Error('Form not found');

      // Ensure submit button is enabled (form should be valid)
      const submitButton = screen.getByRole('button', {
        name: 'vms-settings.actions.applyChanges',
      });
      await waitFor(() => expect(submitButton).toBeEnabled());

      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockVMSAPI.edit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'Milestone',
            ip: '10.0.0.2', // Changed value
            port: 80,
            username: 'updated_user', // Changed value
            password: 'password123', // Original password (not changed in this test)
          }),
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('vms-settings.toast.success', {
          description: expect.stringContaining(
            'vms-settings.toast.description'
          ),
        });
      });
    });

    it('should handle form submission for Genetec', async () => {
      mockVMSAPI.edit.mockImplementation((_data, options) => {
        options?.onSuccess?.();
        return Promise.resolve();
      });

      const { container } = renderComponent();

      // Wait for form to populate
      await waitFor(() => {
        expect(screen.getByDisplayValue('10.0.0.1')).toBeInTheDocument();
      });

      // Change type to Genetec
      const typeSelect = screen.getByRole('combobox', {
        name: 'vms-settings.selectVMS',
      });
      await userEvent.click(typeSelect);
      const listbox = screen.getByRole('listbox');
      await userEvent.click(within(listbox).getByText('vms-settings.genetec'));

      // Change IP
      const ipInput = screen.getByLabelText('vms-settings.ipAddress');
      await userEvent.clear(ipInput);
      await userEvent.type(ipInput, '10.0.0.3');

      // Find the form and submit
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      if (!form) throw new Error('Form not found');

      const submitButton = screen.getByRole('button', {
        name: 'vms-settings.actions.applyChanges',
      });
      await waitFor(() => expect(submitButton).toBeEnabled());

      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockVMSAPI.edit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'Genetec',
            ip: '10.0.0.3', // Changed value
            port: 80, // Original port
            // Username/password should not be included or be undefined/null for Genetec
          }),
          expect.any(Object)
        );
        // More precise check: ensure username/password are not in the submitted data
        const submittedData = mockVMSAPI.edit.mock.calls[0][0];
        expect(submittedData.username).toBeFalsy();
        expect(submittedData.password).toBeFalsy();
      });

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('vms-settings.toast.success', {
          description: expect.stringContaining(
            'vms-settings.toast.description'
          ),
        });
      });
    });
  });

  describe('Success and Error Handling', () => {
    it('should show success toast on successful submission', async () => {
      mockVMSAPI.edit.mockImplementation((_data, options) => {
        options?.onSuccess?.();
        return Promise.resolve();
      });

      const { container } = renderComponent();
      await waitFor(() => {
        expect(screen.getByDisplayValue('10.0.0.1')).toBeInTheDocument();
      });

      const form = container.querySelector('form');
      if (!form) throw new Error('Form not found');

      const submitButton = screen.getByRole('button', {
        name: 'vms-settings.actions.applyChanges',
      });
      await waitFor(() => expect(submitButton).toBeEnabled());

      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('vms-settings.toast.success', {
          description: expect.stringContaining(
            'vms-settings.toast.description'
          ),
        });
      });
    });

    it('should show error toast on submission failure', async () => {
      mockVMSAPI.edit.mockImplementation((_data, options) => {
        options?.onError?.();
        return Promise.reject(new Error('API Error')); // Simulate rejection
      });

      const { container } = renderComponent();
      await waitFor(() => {
        expect(screen.getByDisplayValue('10.0.0.1')).toBeInTheDocument();
      });

      const form = container.querySelector('form');
      if (!form) throw new Error('Form not found');

      const submitButton = screen.getByRole('button', {
        name: 'vms-settings.actions.applyChanges',
      });
      await waitFor(() => expect(submitButton).toBeEnabled());

      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockVMSAPI.edit).toHaveBeenCalled(); // Ensure edit was called
      });

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('vms-settings.toast.error', {
          description: 'vms-settings.toast.errorDescription',
        });
      });
    });
  });
});
