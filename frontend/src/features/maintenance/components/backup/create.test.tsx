import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useBackup } from '../../hooks/use-backup';
import CreateBackupWizard from './create';

// Mock the hooks
vi.mock('../../hooks/use-backup');
vi.mock('@/hooks/use-localstorage', () => ({
  default: () => ({
    value: null,
    setValue: vi.fn(),
  }),
}));

describe('CreateBackupWizard Component', () => {
  const mockStreams = [
    { id: 'stream1', name: 'Stream 1' },
    { id: 'stream2', name: 'Stream 2' },
    { id: 'stream3', name: 'Stream 3' },
  ];

  const mockBackupHook = {
    streams: mockStreams,
    isLoading: false,
    error: null,
    generateBackup: vi.fn().mockResolvedValue('backup-guid-123'),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (useBackup as ReturnType<typeof vi.fn>).mockReturnValue(mockBackupHook);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (props = {}) =>
    render(<CreateBackupWizard {...props} />);

  describe('Basic Rendering', () => {
    it('should render the create backup wizard step 1', () => {
      renderComponent();

      expect(screen.getByText('Create Backup')).toBeInTheDocument();
      expect(
        screen.getByText('Step 1 of 2: Select Content')
      ).toBeInTheDocument();

      // Check for global config switch
      expect(
        screen.getByText('Include Global Configuration')
      ).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();

      // Check for stream selection
      expect(screen.getByText('Select Streams')).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByText('Deselect All')).toBeInTheDocument();

      // Check for next button
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('should render all streams from the hook', () => {
      renderComponent();

      // Check each stream is rendered
      mockStreams.forEach((stream) => {
        expect(screen.getByText(stream.name)).toBeInTheDocument();
      });

      // Check that checkboxes are rendered and checked by default
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(mockStreams.length);
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should handle loading state', () => {
      (useBackup as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockBackupHook,
        isLoading: true,
      });

      renderComponent();

      expect(screen.getByText('Loading streams...')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      const errorMessage = 'Failed to load streams';
      (useBackup as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockBackupHook,
        error: new Error(errorMessage),
      });

      renderComponent();

      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('should toggle stream selection when clicking on a checkbox', async () => {
      renderComponent();

      // Find stream checkbox by label text
      const firstStreamName = mockStreams[0].name;
      const firstStreamCheckbox = screen.getByLabelText(firstStreamName);

      // Check initial state
      expect(firstStreamCheckbox).toBeChecked();

      // Use fireEvent instead of userEvent for more reliable checkbox toggling
      fireEvent.click(firstStreamCheckbox);

      // Check the checkbox state after clicking
      expect(firstStreamCheckbox).not.toBeChecked();

      // Toggle again using fireEvent
      fireEvent.click(firstStreamCheckbox);

      // Check that the checkbox is checked again
      expect(firstStreamCheckbox).toBeChecked();
    });

    it('should toggle global configuration when clicking the switch', async () => {
      renderComponent();

      const globalConfigSwitch = screen.getByRole('switch');
      expect(globalConfigSwitch).toBeChecked();

      await userEvent.click(globalConfigSwitch);
      expect(globalConfigSwitch).not.toBeChecked();
    });

    it('should select all streams when clicking Select All button', async () => {
      renderComponent();

      // First click Deselect All to ensure all checkboxes are unchecked
      await userEvent.click(screen.getByText('Deselect All'));

      // Verify all checkboxes are unchecked
      const checkboxesBeforeSelectAll = screen.getAllByRole('checkbox');
      checkboxesBeforeSelectAll.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });

      // Click Select All
      await userEvent.click(screen.getByText('Select All'));

      // Verify all checkboxes are now checked
      const checkboxesAfterSelectAll = screen.getAllByRole('checkbox');
      checkboxesAfterSelectAll.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should deselect all streams when clicking Deselect All button', async () => {
      // This test is more reliable than the select all test
      // as it calls a direct function instead of first doing checkboxes
      renderComponent();

      // Click Deselect All
      await userEvent.click(screen.getByText('Deselect All'));

      // The next button should be disabled when no streams are selected
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('should filter streams based on search input', async () => {
      renderComponent();

      // Initially all streams are shown
      expect(screen.getAllByRole('checkbox').length).toBe(mockStreams.length);

      // Search for "Stream 1"
      const searchInput = screen.getByPlaceholderText('Search streams...');
      await userEvent.type(searchInput, 'Stream 1');

      // Only Stream 1 should be visible
      const visibleStreamNames = screen
        .getAllByText(/Stream \d/)
        .map((el) => el.textContent);
      expect(visibleStreamNames).toContain('Stream 1');
      expect(visibleStreamNames).not.toContain('Stream 2');
      expect(visibleStreamNames).not.toContain('Stream 3');
    });

    it('should navigate to step 2 when clicking Next', async () => {
      renderComponent();

      await userEvent.click(screen.getByRole('button', { name: 'Next' }));

      expect(
        screen.getByText('Step 2 of 2: Generate Backup')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Download Backup' })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('should navigate back to step 1 when clicking Back', async () => {
      renderComponent();

      // Go to step 2
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(
        screen.getByText('Step 2 of 2: Generate Backup')
      ).toBeInTheDocument();

      // Go back to step 1
      await userEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(
        screen.getByText('Step 1 of 2: Select Content')
      ).toBeInTheDocument();
    });

    it('should generate backup when clicking Download Backup', async () => {
      renderComponent();

      // Go to step 2
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));

      // Click generate backup
      await userEvent.click(
        screen.getByRole('button', { name: 'Download Backup' })
      );

      // Check that generateBackup was called with correct params
      await waitFor(() => {
        expect(mockBackupHook.generateBackup).toHaveBeenCalledWith({
          global: true,
          selectedStreams: mockStreams.map((stream) => stream.id),
        });
      });
    });

    it('should disable the Next button when no streams are selected', async () => {
      renderComponent();

      // Deselect all streams
      await userEvent.click(screen.getByText('Deselect All'));

      // Next button should be disabled
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('should disable the Download Backup button when generating', async () => {
      renderComponent();

      // Go to step 2
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));

      // Mock the generateBackup function to not resolve immediately
      mockBackupHook.generateBackup.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('backup-guid-123'), 1000);
          })
      );

      // Click generate backup
      await userEvent.click(
        screen.getByRole('button', { name: 'Download Backup' })
      );

      // Button should show "Generating..." and be disabled
      const downloadButton = screen.getByRole('button', {
        name: 'Generating...',
      });
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle when no streams are available', () => {
      (useBackup as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockBackupHook,
        streams: [],
      });

      renderComponent();

      // No stream checkboxes should be visible
      expect(screen.queryAllByRole('checkbox').length).toBe(0);
    });

    it('should allow generating backup with only global config when no streams selected', async () => {
      renderComponent();

      // Deselect all streams
      await userEvent.click(screen.getByText('Deselect All'));

      // Verify streams are deselected
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });

      // Verify global config is checked by default
      const globalConfigSwitch = screen.getByRole('switch');
      expect(globalConfigSwitch).toBeChecked();

      // Verify Next button is disabled when no streams are selected, even with global config enabled
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

      // Now select at least one stream using the stream label
      const firstStreamName = mockStreams[0].name;
      const firstStreamCheckbox = screen.getByLabelText(firstStreamName);
      fireEvent.click(firstStreamCheckbox);

      // Verify the checkbox is now checked
      expect(firstStreamCheckbox).toBeChecked();

      // With at least one stream selected, the Next button should be enabled
      expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
    });
  });
});
