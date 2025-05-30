import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Accordion } from '@/components/ui/accordion.tsx';

// Mock the useSources hook
const mockUseSources = vi.fn();
vi.mock('../../hooks/use-sources.tsx', () => ({
  default: () => mockUseSources(),
}));

// Mock react-hook-form completely
const mockUseWatch = vi.fn<() => string[]>(() => []);
vi.mock('react-hook-form', () => ({
  useWatch: mockUseWatch,
  FormProvider: ({ children }: { children: React.ReactNode }) => children,
  useFormContext: vi.fn(() => ({
    control: {},
    setValue: vi.fn(),
    getFieldState: vi.fn(() => ({ error: null })),
    formState: {},
  })),
  Controller: ({
    render: renderProp,
  }: {
    render: (props: {
      field: { value: string[]; onChange: () => void; onBlur: () => void };
      fieldState: { error: null };
      formState: Record<string, unknown>;
    }) => React.ReactNode;
  }) =>
    renderProp({
      field: { value: [], onChange: vi.fn(), onBlur: vi.fn() },
      fieldState: { error: null },
      formState: {},
    }),
}));

// Mock forensic form context
vi.mock('../../providers/forensic-form-context.tsx', () => ({
  useForensicForm: vi.fn(() => ({
    formMethods: {
      control: {},
      setValue: vi.fn(),
    },
  })),
}));

const mockCameras = [
  { id: 'camera-1', name: 'Camera 1' },
  { id: 'camera-2', name: 'Camera 2' },
  { id: 'camera-3', name: 'Camera 3' },
];

describe('Sources', () => {
  let queryClient: QueryClient;
  let mockSetSelectedCameras: ReturnType<typeof vi.fn>;
  let mockOnSelectedCamerasChange: ReturnType<typeof vi.fn>;

  const renderComponent = async (props = {}) => {
    const defaultProps = {
      useScrollArea: false,
      onSelectedCamerasChange: mockOnSelectedCamerasChange,
    };

    const mergedProps = { ...defaultProps, ...props };

    // Dynamically import the component to avoid hoisting issues
    const { default: Sources } = await import('./sources');

    const result = render(
      <QueryClientProvider client={queryClient}>
        <Accordion type="single" collapsible defaultValue="sources">
          <Sources {...mergedProps} />
        </Accordion>
      </QueryClientProvider>
    );

    return result;
  };

  beforeEach(() => {
    // Mock environment variable
    vi.stubEnv('MAIN_API_URL', 'http://localhost:8000');

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockOnSelectedCamerasChange = vi.fn();
    mockSetSelectedCameras = vi.fn();

    // Reset useWatch to default empty array
    mockUseWatch.mockReturnValue([]);

    // Default mock for useSources
    mockUseSources.mockReturnValue({
      cameras: mockCameras,
      isLoading: false,
      isError: false,
      error: null,
      selectedCameras: [],
      setSelectedCameras: mockSetSelectedCameras,
    });

    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', async () => {
      await renderComponent();
      expect(screen.getByText('forensic:sources.title')).toBeInTheDocument();
    });

    it('should render accordion trigger with title', async () => {
      await renderComponent();
      expect(
        screen.getByRole('button', { name: /forensic:sources\.title/i })
      ).toBeInTheDocument();
      expect(screen.getByText('forensic:sources.title')).toBeInTheDocument();
    });

    it('should show selected count when cameras are selected', async () => {
      // Mock useWatch to return selected sources
      mockUseWatch.mockReturnValue(['camera-1', 'camera-2']);

      mockUseSources.mockReturnValue({
        cameras: mockCameras,
        isLoading: false,
        isError: false,
        error: null,
        selectedCameras: ['camera-1', 'camera-2'],
        setSelectedCameras: mockSetSelectedCameras,
      });

      await renderComponent();
      expect(
        screen.getByText('(2 forensic:sources.selected)')
      ).toBeInTheDocument();
    });

    it('should render search input', async () => {
      await renderComponent();
      expect(
        screen.getByPlaceholderText('forensic:sources.search_placeholder')
      ).toBeInTheDocument();
    });

    it('should render camera list', async () => {
      await renderComponent();
      mockCameras.forEach((camera) => {
        expect(screen.getByLabelText(camera.name)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should handle loading state', async () => {
      mockUseSources.mockReturnValue({
        cameras: [],
        isLoading: true,
        isError: false,
        error: null,
        selectedCameras: [],
        setSelectedCameras: mockSetSelectedCameras,
      });

      await renderComponent();

      // During loading, cameras should not be visible
      expect(screen.queryByLabelText('Camera 1')).not.toBeInTheDocument();
    });

    it('should show cameras when not loading', async () => {
      await renderComponent();

      // Should show actual camera content
      expect(screen.getByLabelText('Camera 1')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter cameras based on search term', async () => {
      await renderComponent();

      const searchInput = screen.getByPlaceholderText(
        'forensic:sources.search_placeholder'
      );
      await userEvent.type(searchInput, 'Camera 1');

      // Only Camera 1 should be visible
      expect(screen.getByLabelText('Camera 1')).toBeInTheDocument();
      expect(screen.queryByLabelText('Camera 2')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Camera 3')).not.toBeInTheDocument();
    });

    it('should show no cameras found message when search yields no results', async () => {
      await renderComponent();

      const searchInput = screen.getByPlaceholderText(
        'forensic:sources.search_placeholder'
      );
      await userEvent.type(searchInput, 'NonExistentCamera');

      expect(
        screen.getByText('forensic:sources.no_cameras_found')
      ).toBeInTheDocument();
    });

    it('should clear search results when search term is cleared', async () => {
      await renderComponent();

      const searchInput = screen.getByPlaceholderText(
        'forensic:sources.search_placeholder'
      );

      // Search for something specific
      await userEvent.type(searchInput, 'Camera 1');
      expect(screen.queryByLabelText('Camera 2')).not.toBeInTheDocument();

      // Clear search
      await userEvent.clear(searchInput);

      // All cameras should be visible again
      expect(screen.getByLabelText('Camera 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Camera 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Camera 3')).toBeInTheDocument();
    });
  });

  describe('Camera Selection', () => {
    it('should select individual camera when checkbox is clicked', async () => {
      await renderComponent();

      const camera1Checkbox = screen.getByLabelText('Camera 1');
      fireEvent.click(camera1Checkbox);

      expect(mockSetSelectedCameras).toHaveBeenCalledWith(['camera-1']);
    });

    it('should deselect individual camera when checkbox is clicked again', async () => {
      mockUseSources.mockReturnValue({
        cameras: mockCameras,
        isLoading: false,
        isError: false,
        error: null,
        selectedCameras: ['camera-1'],
        setSelectedCameras: mockSetSelectedCameras,
      });

      await renderComponent();

      const camera1Checkbox = screen.getByLabelText('Camera 1');
      fireEvent.click(camera1Checkbox);

      expect(mockSetSelectedCameras).toHaveBeenCalledWith([]);
    });

    it('should call onSelectedCamerasChange when provided', async () => {
      await renderComponent();

      const camera1Checkbox = screen.getByLabelText('Camera 1');
      fireEvent.click(camera1Checkbox);

      expect(mockOnSelectedCamerasChange).toHaveBeenCalledWith(['camera-1']);
    });
  });

  describe('Select All Functionality', () => {
    it('should select all cameras when Select All is clicked', async () => {
      await renderComponent();

      const selectAllCheckbox = screen.getByLabelText(
        'forensic:sources.select_all'
      );
      fireEvent.click(selectAllCheckbox);

      expect(mockSetSelectedCameras).toHaveBeenCalledWith([
        'camera-1',
        'camera-2',
        'camera-3',
      ]);
    });

    it('should deselect all cameras when Select All is clicked again', async () => {
      mockUseSources.mockReturnValue({
        cameras: mockCameras,
        isLoading: false,
        isError: false,
        error: null,
        selectedCameras: ['camera-1', 'camera-2', 'camera-3'],
        setSelectedCameras: mockSetSelectedCameras,
      });

      await renderComponent();

      const selectAllCheckbox = screen.getByLabelText(
        'forensic:sources.select_all'
      );
      fireEvent.click(selectAllCheckbox);

      expect(mockSetSelectedCameras).toHaveBeenCalledWith([]);
    });

    it('should work correctly with filtered cameras', async () => {
      await renderComponent();

      // Filter to show only Camera 1
      const searchInput = screen.getByPlaceholderText(
        'forensic:sources.search_placeholder'
      );
      await userEvent.type(searchInput, 'Camera 1');

      // Select all (should only select filtered camera)
      const selectAllCheckbox = screen.getByLabelText(
        'forensic:sources.select_all'
      );
      fireEvent.click(selectAllCheckbox);

      expect(mockSetSelectedCameras).toHaveBeenCalledWith(['camera-1']);
    });

    it('should show checked state when all filtered cameras are selected', async () => {
      mockUseSources.mockReturnValue({
        cameras: mockCameras,
        isLoading: false,
        isError: false,
        error: null,
        selectedCameras: ['camera-1'],
        setSelectedCameras: mockSetSelectedCameras,
      });

      await renderComponent();

      // Filter to show only Camera 1
      const searchInput = screen.getByPlaceholderText(
        'forensic:sources.search_placeholder'
      );
      await userEvent.type(searchInput, 'Camera 1');

      // Select All checkbox should be checked since all filtered cameras are selected
      const selectAllCheckbox = screen.getByLabelText(
        'forensic:sources.select_all'
      );
      expect(selectAllCheckbox).toBeChecked();
    });
  });

  describe('Preview Popover', () => {
    it('should show preview button for each camera', async () => {
      await renderComponent();

      const previewButtons = screen.getAllByLabelText("Afficher l'aperçu");
      expect(previewButtons).toHaveLength(mockCameras.length);
    });

    it('should open popover when preview button is clicked', async () => {
      await renderComponent();

      const previewButtons = screen.getAllByLabelText("Afficher l'aperçu");
      await userEvent.click(previewButtons[0]);

      // Should show preview image
      const previewImage = screen.getByAltText('Camera 1');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute(
        'src',
        'http://localhost:8000/vms/cameras/camera-1/live'
      );
    });
  });

  describe('Props and Configuration', () => {
    it('should render without onSelectedCamerasChange callback', async () => {
      await renderComponent({ onSelectedCamerasChange: undefined });

      const camera1Checkbox = screen.getByLabelText('Camera 1');
      fireEvent.click(camera1Checkbox);

      // Should not throw error and should still work
      expect(mockSetSelectedCameras).toHaveBeenCalledWith(['camera-1']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty camera list gracefully', async () => {
      mockUseSources.mockReturnValue({
        cameras: [],
        isLoading: false,
        isError: false,
        error: null,
        selectedCameras: [],
        setSelectedCameras: mockSetSelectedCameras,
      });

      await renderComponent();

      expect(
        screen.getByText('forensic:sources.no_cameras_found')
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText('forensic:sources.select_all')
      ).not.toBeInTheDocument();
    });

    it('should handle camera selection when selectedCameras is undefined', async () => {
      mockUseSources.mockReturnValue({
        cameras: mockCameras,
        isLoading: false,
        isError: false,
        error: null,
        selectedCameras: undefined as string[] | undefined,
        setSelectedCameras: mockSetSelectedCameras,
      });

      await renderComponent();

      // Should still render cameras without errors
      expect(screen.getByLabelText('Camera 1')).toBeInTheDocument();
    });

    it('should handle very long camera names', async () => {
      const longNameCamera = {
        id: 'long-camera',
        name: 'This is a very long camera name that might cause layout issues in the UI components and should be handled gracefully',
      };

      mockUseSources.mockReturnValue({
        cameras: [longNameCamera],
        isLoading: false,
        isError: false,
        error: null,
        selectedCameras: [],
        setSelectedCameras: mockSetSelectedCameras,
      });

      await renderComponent();

      expect(screen.getByLabelText(longNameCamera.name)).toBeInTheDocument();
    });

    it('should handle rapid successive checkbox clicks', async () => {
      await renderComponent();

      const camera1Checkbox = screen.getByLabelText('Camera 1');

      // Rapid clicks
      fireEvent.click(camera1Checkbox);
      fireEvent.click(camera1Checkbox);
      fireEvent.click(camera1Checkbox);

      // Should handle multiple calls without issues
      expect(mockSetSelectedCameras).toHaveBeenCalledTimes(3);
    });
  });
});
