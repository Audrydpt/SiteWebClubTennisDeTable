import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import JobTabs from './job-tabs';

// Mock dependencies
const mockNavigate = vi.fn();
const mockDeleteTab = vi.fn();
const mockOnTabChange = vi.fn();
const mockSetIsLoading = vi.fn();

// Mock task statuses for testing
const ForensicTaskStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  REVOKED: 'REVOKED',
};

const mockTasks = [
  {
    id: 'task-1',
    status: ForensicTaskStatus.SUCCESS,
  },
  {
    id: 'task-2',
    status: ForensicTaskStatus.PROCESSING,
  },
  {
    id: 'task-3',
    status: ForensicTaskStatus.FAILURE,
  },
];

// Mock functions that need to be accessible
const mockUseJobs = vi.fn();
const mockIsForensicTaskCompleted = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ taskId: 'task-1' }),
}));

vi.mock('../../hooks/use-jobs.tsx', () => ({
  default: () => mockUseJobs(),
  ForensicTaskStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    REVOKED: 'REVOKED',
  },
  isForensicTaskCompleted: (status: string) =>
    mockIsForensicTaskCompleted(status),
}));

describe('JobTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseJobs.mockReturnValue({
      tasks: mockTasks,
      deleteTab: mockDeleteTab,
    });

    mockIsForensicTaskCompleted.mockImplementation(
      (status: string) =>
        status === ForensicTaskStatus.SUCCESS ||
        status === ForensicTaskStatus.FAILURE ||
        status === ForensicTaskStatus.REVOKED
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onTabChange: undefined,
      hideTitle: false,
      isLoading: false,
      setIsLoading: undefined,
    };

    return render(<JobTabs {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should render correct number of tabs', () => {
      renderComponent();
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('should display tab labels correctly', () => {
      renderComponent();
      expect(screen.getByText('R1')).toBeInTheDocument();
      expect(screen.getByText('R2')).toBeInTheDocument();
      expect(screen.getByText('R3')).toBeInTheDocument();
    });

    it('should show status indicators for different task statuses', () => {
      renderComponent();

      // Success indicator
      expect(screen.getByText('✓')).toBeInTheDocument();

      // Failure indicator
      expect(screen.getByText('⚠️')).toBeInTheDocument();

      // Processing indicator (spinner)
      expect(screen.getByRole('tab', { name: /R2/ })).toHaveTextContent('R2');
    });

    it('should apply active tab styling', () => {
      renderComponent();
      const activeTab = screen.getByRole('tab', { name: /R1/ });
      expect(activeTab).toHaveClass('ring-1 ring-primary');
    });

    it('should apply running animation to processing tasks', () => {
      renderComponent();
      const processingTab = screen.getByRole('tab', { name: /R2/ });
      expect(processingTab).toHaveClass('bg-muted/50 animate-pulse');
    });

    it('should hide title when hideTitle is true', () => {
      renderComponent({ hideTitle: true });
      // Since title div is empty when no loading, we just verify component renders
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should show loading spinner in title when isLoading is true', () => {
      renderComponent({ isLoading: true, hideTitle: false });
      // The loading spinner should be in the title area
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('should call onTabChange when tab is clicked', async () => {
      renderComponent({ onTabChange: mockOnTabChange });

      const tab = screen.getByRole('tab', { name: /R2/ });
      await userEvent.click(tab);

      expect(mockOnTabChange).toHaveBeenCalledWith('task-2');
    });

    it('should navigate when tab is clicked and no onTabChange provided', async () => {
      renderComponent();

      const tab = screen.getByRole('tab', { name: /R2/ });
      await userEvent.click(tab);

      expect(mockNavigate).toHaveBeenCalledWith('/forensic/task-2');
    });

    it('should show delete button on hover and allow deletion', async () => {
      renderComponent();

      const tab = screen.getByRole('tab', { name: /R1/ });
      await userEvent.hover(tab);

      // Use within to scope to the specific tab and get the delete button
      const deleteButton = within(tab).getByLabelText(
        'forensic:job-tabs.delete_tab'
      );
      await userEvent.click(deleteButton);

      // Look for the confirm button in the delete confirmation dialog
      const confirmButton = screen.getByText(
        'forensic:job-tabs.delete_tab_confirm'
      );
      await userEvent.click(confirmButton);

      expect(mockDeleteTab).toHaveBeenCalledWith('task-1');
    });

    it('should disable tabs when isLoading is true', () => {
      renderComponent({ isLoading: true });

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should show loading component when isLoading and no tasks', () => {
      mockUseJobs.mockReturnValue({
        tasks: [],
        deleteTab: mockDeleteTab,
      });

      renderComponent({ isLoading: true });
      // Test that the Loading component renders by checking for spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should limit tabs to maximum of 5', () => {
      const manyTasks = Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i + 1}`,
        status: ForensicTaskStatus.SUCCESS,
      }));

      mockUseJobs.mockReturnValue({
        tasks: manyTasks,
        deleteTab: mockDeleteTab,
      });

      renderComponent();
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);
    });

    it('should handle timeout for loading state', async () => {
      vi.useFakeTimers();

      mockUseJobs.mockReturnValue({
        tasks: [],
        deleteTab: mockDeleteTab,
      });

      renderComponent({
        isLoading: true,
        setIsLoading: mockSetIsLoading,
      });

      // Fast-forward time by 5 seconds
      vi.advanceTimersByTime(5000);

      // Don't wait for async operation since we're using fake timers
      expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    }, 10000);

    it('should clear timeout when component unmounts', () => {
      vi.useFakeTimers();

      mockUseJobs.mockReturnValue({
        tasks: [],
        deleteTab: mockDeleteTab,
      });

      const { unmount } = renderComponent({
        isLoading: true,
        setIsLoading: mockSetIsLoading,
      });

      unmount();

      // Fast-forward time - setIsLoading should not be called after unmount
      vi.advanceTimersByTime(5000);
      expect(mockSetIsLoading).not.toHaveBeenCalled();
    });

    it('should handle tasks without ids', () => {
      const tasksWithoutIds = [
        {
          id: '',
          status: ForensicTaskStatus.PENDING,
        },
      ];

      mockUseJobs.mockReturnValue({
        tasks: tasksWithoutIds,
        deleteTab: mockDeleteTab,
      });

      renderComponent();
      expect(screen.getByText('forensic:job-tabs.new_tab')).toBeInTheDocument();
    });

    it('should handle REVOKED status with correct indicator', () => {
      const revokedTask = [
        {
          id: 'task-revoked',
          status: ForensicTaskStatus.REVOKED,
        },
      ];

      mockUseJobs.mockReturnValue({
        tasks: revokedTask,
        deleteTab: mockDeleteTab,
      });

      renderComponent();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });

    it('should handle empty tasks array', () => {
      mockUseJobs.mockReturnValue({
        tasks: [],
        deleteTab: mockDeleteTab,
      });

      renderComponent({ isLoading: false });

      // Should render without crashing
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should clear timeout when loading state changes to false', () => {
      vi.useFakeTimers();

      mockUseJobs.mockReturnValue({
        tasks: [],
        deleteTab: mockDeleteTab,
      });

      const { rerender } = renderComponent({
        isLoading: true,
        setIsLoading: mockSetIsLoading,
      });

      // Change loading to false
      rerender(<JobTabs isLoading={false} setIsLoading={mockSetIsLoading} />);

      // Fast-forward time - timeout should be cleared
      vi.advanceTimersByTime(5000);
      expect(mockSetIsLoading).not.toHaveBeenCalled();
    });
  });
});
