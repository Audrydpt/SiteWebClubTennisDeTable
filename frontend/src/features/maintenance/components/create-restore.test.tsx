import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useBackup } from '../hooks/use-backup';
import { useRestore } from '../hooks/use-restore';
import CreateRestoreBackup from './create-restore';

// Mock the hooks
vi.mock('../hooks/use-backup');
vi.mock('../hooks/use-restore');
vi.mock('@/components/reboot-status', () => ({
  default: ({ onRebootComplete }: { onRebootComplete: () => void }) => (
    <div data-testid="reboot-status">
      <button type="button" onClick={() => onRebootComplete()}>
        Complete Reboot
      </button>
    </div>
  ),
}));

// Mock the RestoreBackupWizard component
vi.mock('./backup/restore', () => ({
  default: ({ onClose }: { onClose: (skipReboot: boolean) => void }) => (
    <div data-testid="restore-wizard">
      <button
        type="button"
        data-testid="with-reboot-button"
        onClick={() => onClose(false)}
      >
        Complete Restore (with reboot)
      </button>
      <button
        type="button"
        data-testid="skip-reboot-button"
        onClick={() => onClose(true)}
      >
        Complete Restore (skip reboot)
      </button>
    </div>
  ),
}));

// No need to mock useState, we'll use a simpler approach for testing

describe('CreateRestoreBackup Component', () => {
  const mockBackupHook = {
    streams: [
      { id: 'stream1', name: 'Stream 1' },
      { id: 'stream2', name: 'Stream 2' },
    ],
    isLoading: false,
    error: null,
    refetchStreams: vi.fn(),
    generateBackup: vi.fn().mockResolvedValue('backup-guid-123'),
    backupStatus: 'idle',
    backupError: null,
  };

  const mockRestoreHook = {
    uploadBackup: vi.fn().mockResolvedValue(undefined),
    restoreBackup: vi.fn().mockResolvedValue(undefined),
    reboot: vi.fn().mockResolvedValue(undefined),
    streams: [
      { id: 'stream1', name: 'Stream 1' },
      { id: 'stream2', name: 'Stream 2' },
    ],
    isLoading: false,
    restorePoint: {
      id: 'restore-point-1',
      date: '2023-08-15',
      unit: true,
      streamData: {
        stream1: 'Stream 1',
        stream2: 'Stream 2',
      },
    },
    error: null,
    lastBackupGuid: 'backup-guid-123',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (useBackup as ReturnType<typeof vi.fn>).mockReturnValue(mockBackupHook);
    (useRestore as ReturnType<typeof vi.fn>).mockReturnValue(mockRestoreHook);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (props = {}) =>
    render(<CreateRestoreBackup {...props} />);

  describe('Basic Rendering', () => {
    it('should render the backup & restore card', () => {
      renderComponent();
      expect(screen.getByText('Backup & Restore')).toBeInTheDocument();

      // Use a more specific selector for the button text
      const createButton = screen.getByRole('button', {
        name: /Create Backup/i,
      });
      expect(createButton).toBeInTheDocument();

      const restoreButton = screen.getByRole('button', {
        name: /Restore Backup/i,
      });
      expect(restoreButton).toBeInTheDocument();
    });

    it('should initially not show any dialog', () => {
      renderComponent();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('should open create backup dialog when clicking Create Backup button', async () => {
      renderComponent();
      // Use a more specific selector to find the initial button
      const createButton = screen.getByRole('button', {
        name: (content) =>
          content.includes('Create Backup') && !content.includes('Restore'),
      });
      await userEvent.click(createButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Instead of looking for a heading, check for dialog content
      const dialogContent = within(dialog).getAllByText(/Create Backup/i);
      expect(dialogContent.length).toBeGreaterThan(0);
    });

    it('should open restore backup dialog when clicking Restore Backup button', async () => {
      renderComponent();
      // Use a more specific selector to find the restore button
      const restoreButton = screen.getByRole('button', {
        name: (content) => content.includes('Restore Backup'),
      });
      await userEvent.click(restoreButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Instead of looking for a heading, check for dialog content
      const dialogContent = within(dialog).getAllByText(/Restore Backup/i);
      expect(dialogContent.length).toBeGreaterThan(0);
    });

    it('should close dialog when clicking outside', async () => {
      renderComponent();
      const createButton = screen.getByRole('button', {
        name: (content) =>
          content.includes('Create Backup') && !content.includes('Restore'),
      });
      await userEvent.click(createButton);

      // The dialog should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Simulate clicking the close button
      const closeButton = screen.getByRole('button', { name: 'Close' });
      await userEvent.click(closeButton);

      // Dialog should disappear
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should show reboot status when restore wizard closes with skipRebootDialog=false', async () => {
      renderComponent();

      // Open restore dialog
      const restoreButton = screen.getByRole('button', {
        name: (content) => content.includes('Restore Backup'),
      });
      await userEvent.click(restoreButton);

      // Check for the restore wizard
      const restoreWizard = screen.getByTestId('restore-wizard');
      expect(restoreWizard).toBeInTheDocument();

      // Complete restore with reboot
      const withRebootButton = screen.getByTestId('with-reboot-button');
      await userEvent.click(withRebootButton);

      // Check that reboot status is shown
      expect(screen.getByTestId('reboot-status')).toBeInTheDocument();
    });

    it('should close dialog without showing reboot status when restore wizard closes with skipRebootDialog=true', async () => {
      renderComponent();

      // Open restore dialog
      const restoreButton = screen.getByRole('button', {
        name: (content) => content.includes('Restore Backup'),
      });
      await userEvent.click(restoreButton);

      // Find the restore wizard component
      const restoreWizard = screen.getByTestId('restore-wizard');
      expect(restoreWizard).toBeInTheDocument();

      // Find the skip-reboot button and click it
      const skipRebootButton = screen.getByTestId('skip-reboot-button');
      await userEvent.click(skipRebootButton);

      // Check that dialog is closed and reboot status is not shown
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByTestId('reboot-status')).not.toBeInTheDocument();
      });
    });

    it('should close reboot status when reboot completes', async () => {
      renderComponent();

      // Open restore dialog
      const restoreButton = screen.getByRole('button', {
        name: (content) => content.includes('Restore Backup'),
      });
      await userEvent.click(restoreButton);

      // Find the restore wizard and click the with-reboot button
      const withRebootButton = screen.getByTestId('with-reboot-button');
      await userEvent.click(withRebootButton);

      // Check that reboot status is shown
      const rebootStatus = screen.getByTestId('reboot-status');
      expect(rebootStatus).toBeInTheDocument();

      // Complete the reboot
      const completeRebootButton = within(rebootStatus).getByRole('button');
      await userEvent.click(completeRebootButton);

      // Check that reboot status is closed
      await waitFor(() => {
        expect(screen.queryByTestId('reboot-status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle loading state in backup wizard', async () => {
      (useBackup as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockBackupHook,
        isLoading: true,
      });

      renderComponent();
      const createButton = screen.getByRole('button', {
        name: (content) =>
          content.includes('Create Backup') && !content.includes('Restore'),
      });
      await userEvent.click(createButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(
        within(dialog).getByText('Loading streams...')
      ).toBeInTheDocument();
    });

    it('should handle errors in backup wizard', async () => {
      (useBackup as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockBackupHook,
        error: new Error('Failed to load streams'),
      });

      renderComponent();
      const createButton = screen.getByRole('button', {
        name: (content) =>
          content.includes('Create Backup') && !content.includes('Restore'),
      });
      await userEvent.click(createButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/Error:/)).toBeInTheDocument();
    });
  });
});
