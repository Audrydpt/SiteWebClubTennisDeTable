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
import IASettings from './ai-settings';

import useAIAPI from '../hooks/use-ai';

// Mock the AI API hook
vi.mock('../hooks/use-ai');

describe('IASettings', () => {
  const mockAIAPI = {
    query: {
      data: {
        ip: '192.168.1.100',
        port: 8080,
        object: 'yolov8',
        vehicle: 'resnet50',
        person: 'resnet18',
      },
      isLoading: false,
    },
    describeQuery: {
      data: {
        detector: [
          { model: 'yolov8', name: 'YOLOv8' },
          { model: 'yolov5', name: 'YOLOv5' },
        ],
        classifier: [
          { model: 'resnet50', name: 'ResNet50' },
          { model: 'resnet18', name: 'ResNet18' },
        ],
      },
      isLoading: false,
      isFetched: true,
    },
    edit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAIAPI as jest.Mock).mockReturnValue(mockAIAPI);
  });

  const renderComponent = () => render(<IASettings />);

  describe('Basic Rendering', () => {
    it('should render the component with title and description', () => {
      renderComponent();

      expect(screen.getByText('ai-settings.title')).toBeInTheDocument();
      expect(screen.getByText('ai-settings.description')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderComponent();

      expect(
        screen.getByLabelText('ai-settings.ipAddress')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('ai-settings.port')).toBeInTheDocument();
      expect(screen.getByText('Select AI Detector')).toBeInTheDocument();
      expect(screen.getByText('Select Vehicle Classifier')).toBeInTheDocument();
      expect(screen.getByText('Select Person Classifier')).toBeInTheDocument();
    });

    it('should populate form with initial data', () => {
      renderComponent();

      expect(screen.getByDisplayValue('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('8080')).toBeInTheDocument();
    });
  });

  describe('Connection Status Badge', () => {
    it('should show success badge when connection is successful', () => {
      renderComponent();

      expect(screen.getByText('Connection successful')).toBeInTheDocument();
    });

    it('should show checking status when loading', () => {
      (useAIAPI as jest.Mock).mockReturnValue({
        ...mockAIAPI,
        describeQuery: {
          ...mockAIAPI.describeQuery,
          isLoading: true,
        },
      });

      renderComponent();

      expect(screen.getByText('Checking connection...')).toBeInTheDocument();
    });

    it('should show failure badge when connection fails', () => {
      (useAIAPI as jest.Mock).mockReturnValue({
        ...mockAIAPI,
        describeQuery: {
          ...mockAIAPI.describeQuery,
          data: null,
        },
      });

      renderComponent();

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should handle IP address change', async () => {
      renderComponent();

      const ipInput = screen.getByLabelText('ai-settings.ipAddress');
      await userEvent.clear(ipInput);
      await userEvent.type(ipInput, '192.168.1.200');

      expect(ipInput).toHaveValue('192.168.1.200');
    });

    it('should handle port number change', async () => {
      renderComponent();

      const portInput = screen.getByLabelText('ai-settings.port');
      await userEvent.clear(portInput);
      await userEvent.type(portInput, '9090');

      expect(portInput).toHaveValue(9090);
    });

    it('should handle form submission', async () => {
      mockAIAPI.edit.mockImplementation((data, options) => {
        options.onSuccess();
        return Promise.resolve();
      });

      const { container } = renderComponent();

      // Fill in all required fields
      const ipInput = screen.getByLabelText('ai-settings.ipAddress');
      await userEvent.clear(ipInput);
      await userEvent.type(ipInput, '192.168.1.100');

      const portInput = screen.getByLabelText('ai-settings.port');
      await userEvent.clear(portInput);
      await userEvent.type(portInput, '8080');

      // Select AI Detector
      const detectorSelect = screen.getByRole('combobox', {
        name: 'Select AI Detector',
      });
      await userEvent.click(detectorSelect);
      const detectorContent = screen.getByRole('listbox');
      await userEvent.click(within(detectorContent).getByText('YOLOv8'));

      // Select Vehicle Classifier
      const vehicleSelect = screen.getByRole('combobox', {
        name: 'Select Vehicle Classifier',
      });
      await userEvent.click(vehicleSelect);
      const vehicleContent = screen.getByRole('listbox');
      await userEvent.click(within(vehicleContent).getByText('ResNet50'));

      // Select Person Classifier
      const personSelect = screen.getByRole('combobox', {
        name: 'Select Person Classifier',
      });
      await userEvent.click(personSelect);
      const personContent = screen.getByRole('listbox');
      await userEvent.click(within(personContent).getByText('ResNet18'));

      // Submit the form
      const form = container.querySelector('form');
      if (!form) throw new Error('Form not found');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockAIAPI.edit).toHaveBeenCalledWith(
          expect.objectContaining({
            ip: '192.168.1.100',
            port: 8080,
            object: 'yolov8',
            vehicle: 'resnet50',
            person: 'resnet18',
          }),
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('ai-settings.toast.success', {
          description: expect.stringMatching(/ai-settings\.toast\.description/),
        });
      });
    });
  });

  describe('Success and Error Handling', () => {
    it('should show success toast on successful submission', async () => {
      mockAIAPI.edit.mockImplementation((data, options) => {
        options.onSuccess();
        return Promise.resolve();
      });

      const { container } = renderComponent();

      // Fill in all required fields
      const ipInput = screen.getByLabelText('ai-settings.ipAddress');
      await userEvent.clear(ipInput);
      await userEvent.type(ipInput, '192.168.1.100');

      const portInput = screen.getByLabelText('ai-settings.port');
      await userEvent.clear(portInput);
      await userEvent.type(portInput, '8080');

      // Select AI Detector
      const detectorSelect = screen.getByRole('combobox', {
        name: 'Select AI Detector',
      });
      await userEvent.click(detectorSelect);
      const detectorContent = screen.getByRole('listbox');
      await userEvent.click(within(detectorContent).getByText('YOLOv8'));

      // Select Vehicle Classifier
      const vehicleSelect = screen.getByRole('combobox', {
        name: 'Select Vehicle Classifier',
      });
      await userEvent.click(vehicleSelect);
      const vehicleContent = screen.getByRole('listbox');
      await userEvent.click(within(vehicleContent).getByText('ResNet50'));

      // Select Person Classifier
      const personSelect = screen.getByRole('combobox', {
        name: 'Select Person Classifier',
      });
      await userEvent.click(personSelect);
      const personContent = screen.getByRole('listbox');
      await userEvent.click(within(personContent).getByText('ResNet18'));

      // Submit the form
      const form = container.querySelector('form');
      if (!form) throw new Error('Form not found');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockAIAPI.edit).toHaveBeenCalledWith(
          expect.objectContaining({
            ip: '192.168.1.100',
            port: 8080,
            object: 'yolov8',
            vehicle: 'resnet50',
            person: 'resnet18',
          }),
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('ai-settings.toast.success', {
          description: expect.stringMatching(/ai-settings\.toast\.description/),
        });
      });
    });

    it('should show error toast on submission failure', async () => {
      mockAIAPI.edit.mockImplementation((data, options) => {
        options.onError();
        return Promise.reject();
      });

      const { container } = renderComponent();

      // Fill in all required fields
      const ipInput = screen.getByLabelText('ai-settings.ipAddress');
      await userEvent.clear(ipInput);
      await userEvent.type(ipInput, '192.168.1.100');

      const portInput = screen.getByLabelText('ai-settings.port');
      await userEvent.clear(portInput);
      await userEvent.type(portInput, '8080');

      // Select AI Detector
      const detectorSelect = screen.getByRole('combobox', {
        name: 'Select AI Detector',
      });
      await userEvent.click(detectorSelect);
      const detectorContent = screen.getByRole('listbox');
      await userEvent.click(within(detectorContent).getByText('YOLOv8'));

      // Select Vehicle Classifier
      const vehicleSelect = screen.getByRole('combobox', {
        name: 'Select Vehicle Classifier',
      });
      await userEvent.click(vehicleSelect);
      const vehicleContent = screen.getByRole('listbox');
      await userEvent.click(within(vehicleContent).getByText('ResNet50'));

      // Select Person Classifier
      const personSelect = screen.getByRole('combobox', {
        name: 'Select Person Classifier',
      });
      await userEvent.click(personSelect);
      const personContent = screen.getByRole('listbox');
      await userEvent.click(within(personContent).getByText('ResNet18'));

      // Submit the form
      const form = container.querySelector('form');
      if (!form) throw new Error('Form not found');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockAIAPI.edit).toHaveBeenCalledWith(
          expect.objectContaining({
            ip: '192.168.1.100',
            port: 8080,
            object: 'yolov8',
            vehicle: 'resnet50',
            person: 'resnet18',
          }),
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('ai-settings.toast.error', {
          description: 'ai-settings.toast.errorDescription',
        });
      });
    });
  });
});
