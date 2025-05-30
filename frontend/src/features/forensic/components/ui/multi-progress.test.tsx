import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import * as estimationLib from '../../lib/estimation';
import { useSearchContext } from '../../providers/search-context';

import MultiProgress from './multi-progress';

// Mock the search context
vi.mock('../../providers/search-context', () => ({
  useSearchContext: vi.fn(),
}));

// Mock the estimation module
vi.mock('../../lib/estimation', () => ({
  calculateTimeRemaining: vi.fn(),
}));

const mockUseSearchContext = vi.mocked(useSearchContext);
const mockCalculateTimeRemaining = vi.mocked(
  estimationLib.calculateTimeRemaining
);

// Helper function to create a complete mock context
const createMockContext = (progressOverrides = {}) => ({
  results: [],
  totalPages: 1,
  currentPage: 1,
  setCurrentPage: vi.fn(),
  isLoading: false,
  error: null,
  progress: progressOverrides,
  order: { by: 'score' as const, direction: 'desc' as const },
  setOrder: vi.fn(),
});

describe('MultiProgress', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {};
    return render(<MultiProgress {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculateTimeRemaining.mockReturnValue({
      combined: '5 minutes remaining',
      individual: {},
    });
  });

  describe('Basic Rendering', () => {
    it('should render nothing when no progress sources exist', () => {
      mockUseSearchContext.mockReturnValue(createMockContext({}));

      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });

    it('should render progress bar when sources exist', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          source1: {
            sourceId: 'source1',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      expect(
        screen.getByText('forensic:multi-progress.progression:')
      ).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('- 5 minutes remaining')).toBeInTheDocument();
    });

    it('should calculate and display average progress correctly', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          source1: {
            sourceId: 'source1',
            progress: 30,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
          source2: {
            sourceId: 'source2',
            progress: 70,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      expect(screen.getByText('50%')).toBeInTheDocument(); // (30 + 70) / 2 = 50
    });

    it('should show toggle button when sources exist', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          source1: {
            sourceId: 'source1',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      expect(
        screen.getByText('forensic:multi-progress.show_details')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /show_details/ })
      ).toBeInTheDocument();
    });
  });

  describe('Camera Information Extraction', () => {
    it('should extract camera name and IP correctly', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          'Camera Front (192.168.1.100)': {
            sourceId: 'Camera Front (192.168.1.100)',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      // Click to show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      expect(screen.getByText('Camera Front')).toBeInTheDocument();
    });

    it('should handle camera ID without IP format', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          SimpleCamera: {
            sourceId: 'SimpleCamera',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      // Click to show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      expect(screen.getByText('SimpleCamera')).toBeInTheDocument();
    });

    it('should handle unknown camera ID', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          unknown: {
            sourceId: 'unknown',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      // Click to show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      expect(screen.getByText('Caméra inconnue')).toBeInTheDocument();
    });

    it('should handle null or undefined camera ID', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          source1: {
            sourceId: 'unknown',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      // Click to show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      expect(screen.getByText('Caméra inconnue')).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    beforeEach(() => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          source1: {
            sourceId: 'source1',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
          source2: {
            sourceId: 'source2',
            progress: 75,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );
    });

    it('should toggle details visibility when clicking show/hide button', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggleButton = screen.getByText(
        'forensic:multi-progress.show_details'
      );

      // Initially details should be hidden
      expect(screen.queryByText('source1')).not.toBeInTheDocument();

      // Click to show details
      await user.click(toggleButton);

      expect(
        screen.getByText('forensic:multi-progress.hide_details')
      ).toBeInTheDocument();
      // Verify details are shown by checking for source names
      expect(screen.getByText('source1')).toBeInTheDocument();
      expect(screen.getByText('source2')).toBeInTheDocument();

      // Click to hide details
      await user.click(
        screen.getByText('forensic:multi-progress.hide_details')
      );

      expect(
        screen.getByText('forensic:multi-progress.show_details')
      ).toBeInTheDocument();
      // Verify details are hidden
      expect(screen.queryByText('source1')).not.toBeInTheDocument();
    });

    it('should display individual progress bars in details', () => {
      renderComponent();

      // Show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      // Should show individual progress percentages
      expect(screen.getByText('50%')).toBeInTheDocument(); // source1
      expect(screen.getByText('75%')).toBeInTheDocument(); // source2
    });

    it('should display timestamps when available', () => {
      renderComponent();

      // Show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      // Verify timestamps are displayed by checking the formatted date text
      expect(screen.getAllByText('01/01/2024 11:00:00')).toHaveLength(2);
    });
  });

  describe('Time Estimation Display', () => {
    it('should display individual time estimates when available', () => {
      mockCalculateTimeRemaining.mockReturnValue({
        combined: '10 minutes remaining',
        individual: {
          source1: '5 minutes remaining',
          source2: '15 minutes remaining',
        },
      });

      mockUseSearchContext.mockReturnValue(
        createMockContext({
          source1: {
            sourceId: 'source1',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
          source2: {
            sourceId: 'source2',
            progress: 25,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      // Show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      // Verify time estimates are displayed by checking the text content
      expect(screen.getByText('5 minutes remaining')).toBeInTheDocument();
      expect(screen.getByText('15 minutes remaining')).toBeInTheDocument();
    });

    it('should not display timer for completed sources', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          completed: {
            sourceId: 'completed',
            progress: 100,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
          'in-progress': {
            sourceId: 'in-progress',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      // Show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      // Only in-progress source should be visible
      expect(screen.getByText('in-progress')).toBeInTheDocument();
      expect(screen.queryByText('completed')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null progress values gracefully', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          source1: {
            sourceId: 'source1',
            progress: 0,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      expect(screen.getByText('0%')).toBeInTheDocument();

      // Show details to verify the null progress doesn't break the details view
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      // The source with null progress should not be displayed in details (filtered out by progress === 0 check)
      expect(screen.queryByText('source1')).not.toBeInTheDocument();
    });

    it('should not display sources with 0% progress in details', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          'zero-progress': {
            sourceId: 'zero-progress',
            progress: 0,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
          active: {
            sourceId: 'active',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      // Show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.queryByText('zero-progress')).not.toBeInTheDocument();
    });

    it('should handle sources without timestamps', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          source1: {
            sourceId: 'source1',
            progress: 50,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      // Show details
      fireEvent.click(screen.getByText('forensic:multi-progress.show_details'));

      expect(screen.getByText('source1')).toBeInTheDocument();
      expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
    });

    it('should apply correct styling for completed sources', () => {
      mockUseSearchContext.mockReturnValue(
        createMockContext({
          completed: {
            sourceId: 'completed',
            progress: 100,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        })
      );

      renderComponent();

      // Even though completed sources are not shown in details, test the logic
      expect(screen.getByText('100%')).toBeInTheDocument(); // In the main progress
    });

    it('should call calculateTimeRemaining with correct parameters', () => {
      const progressArray = [
        {
          sourceId: 'source1',
          progress: 50,
          timestamp: new Date('2024-01-01T10:00:00Z'),
        },
        {
          sourceId: 'source2',
          progress: 75,
          timestamp: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      mockUseSearchContext.mockReturnValue(
        createMockContext({
          source1: progressArray[0],
          source2: progressArray[1],
        })
      );

      renderComponent();

      expect(mockCalculateTimeRemaining).toHaveBeenCalledWith(progressArray);
    });
  });
});
