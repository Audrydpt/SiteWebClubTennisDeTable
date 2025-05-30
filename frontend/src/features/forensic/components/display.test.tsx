import { render, screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSearchContext } from '../providers/search-context';
import Display from './display';

// Mock des hooks
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
}));

vi.mock('../providers/search-context', () => ({
  useSearchContext: vi.fn(),
}));

// Mock de Luxon
vi.mock('luxon', () => ({
  DateTime: {
    fromJSDate: vi.fn(() => ({
      toLocaleString: vi.fn(() => '2024-01-01 10:00'),
      minus: vi.fn(() => ({
        toUTC: vi.fn(() => ({
          toISO: vi.fn(() => '2024-01-01T09:59:55.000Z'),
        })),
      })),
      plus: vi.fn(() => ({
        toUTC: vi.fn(() => ({
          toISO: vi.fn(() => '2024-01-01T10:00:10.000Z'),
        })),
      })),
    })),
    DATETIME_SHORT: 'datetime_short',
  },
}));

// Mock du processus env
Object.defineProperty(process, 'env', {
  value: {
    MAIN_API_URL: 'http://localhost:8000',
  },
});

describe('Display', () => {
  const mockUseParams = useParams as ReturnType<typeof vi.fn>;
  const mockUseSearchContext = useSearchContext as ReturnType<typeof vi.fn>;

  const defaultSearchContext = {
    results: [],
    totalPages: 1,
    currentPage: 1,
    setCurrentPage: vi.fn(),
    isLoading: false,
    error: null,
    progress: {},
    order: { by: 'score' as const, direction: 'desc' as const },
    setOrder: vi.fn(),
  };

  const mockResult = {
    id: 'test-id-1',
    frame_uuid: 'frame-uuid-1',
    camera: 'camera-uuid-1',
    imageData: 'data:image/jpeg;base64,test-image-data',
    score: 0.8,
    timestamp: new Date('2024-01-01T10:00:00Z'),
    type: 'detection',
    metadata: {},
  };

  const renderComponent = (taskId?: string) => {
    mockUseParams.mockReturnValue({ taskId });
    return render(<Display />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchContext.mockReturnValue(defaultSearchContext);
  });

  describe('Basic Rendering', () => {
    it('should render without crashing when no taskId', () => {
      renderComponent();
      expect(
        screen.getByText('forensic:display.no_camera')
      ).toBeInTheDocument();
    });

    it('should display no camera message when taskId is missing', () => {
      renderComponent();
      expect(
        screen.getByText('forensic:display.no_camera')
      ).toBeInTheDocument();
    });

    it('should render main container when taskId is provided', () => {
      renderComponent('test-task-id');
      const container = document.querySelector('.flex.flex-col.space-y-6');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error alert when error occurs', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        error: new Error('Test error'),
      });

      renderComponent('test-task-id');

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('forensic:display.error')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        isLoading: true,
      });

      renderComponent('test-task-id');

      expect(screen.getByText('forensic:display.loading')).toBeInTheDocument();
    });
  });

  describe('Results Display', () => {
    it('should render results when available', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [mockResult],
      });

      renderComponent('test-task-id');

      expect(screen.getByAltText('Forensic result')).toBeInTheDocument();
      expect(screen.getByText('80.0%')).toBeInTheDocument();
    });

    it('should render multiple results', () => {
      const multipleResults = [
        { ...mockResult, id: 'test-id-1', score: 0.8 },
        { ...mockResult, id: 'test-id-2', score: 0.6 },
        { ...mockResult, id: 'test-id-3', score: 0.3 },
      ];

      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: multipleResults,
      });

      renderComponent('test-task-id');

      expect(screen.getAllByAltText('Forensic result')).toHaveLength(3);
      expect(screen.getByText('80.0%')).toBeInTheDocument();
      expect(screen.getByText('60.0%')).toBeInTheDocument();
      expect(screen.getByText('30.0%')).toBeInTheDocument();
    });

    it('should display placeholder when no image data', () => {
      const resultWithoutImage = {
        ...mockResult,
        imageData: null,
      };

      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [resultWithoutImage],
      });

      renderComponent('test-task-id');

      expect(screen.getByText('forensic:display.no_image')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should not render pagination when totalPages <= 1', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        totalPages: 1,
        results: [mockResult],
      });

      renderComponent('test-task-id');

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should render pagination when totalPages > 1', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        totalPages: 3,
        currentPage: 2,
        results: [mockResult],
      });

      renderComponent('test-task-id');

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        totalPages: 3,
        currentPage: 1,
        results: [mockResult],
      });

      renderComponent('test-task-id');

      const prevButton = screen.getByLabelText('Go to previous page');
      expect(prevButton).toHaveClass('pointer-events-none');
    });

    it('should disable next button on last page', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        totalPages: 3,
        currentPage: 3,
        results: [mockResult],
      });

      renderComponent('test-task-id');

      const nextButton = screen.getByLabelText('Go to next page');
      expect(nextButton).toHaveClass('pointer-events-none');
    });
  });

  describe('Score Background Color', () => {
    it('should apply correct background for high scores (>0.7)', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [{ ...mockResult, score: 0.8 }],
      });

      renderComponent('test-task-id');

      // Target the score element with style attribute (the one in the image overlay)
      const scoreElements = screen.getAllByText('80.0%');
      const scoreElementWithStyle = scoreElements.find(
        (el) => el.style.backgroundColor
      );
      expect(scoreElementWithStyle).toBeInTheDocument();
      expect(scoreElementWithStyle?.style.backgroundColor).toBe(
        'rgba(220, 38, 38, 0.8)'
      );
    });

    it('should apply correct background for medium scores (>0.4)', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [{ ...mockResult, score: 0.5 }],
      });

      renderComponent('test-task-id');

      // Target the score element with style attribute (the one in the image overlay)
      const scoreElements = screen.getAllByText('50.0%');
      const scoreElementWithStyle = scoreElements.find(
        (el) => el.style.backgroundColor
      );
      expect(scoreElementWithStyle).toBeInTheDocument();
      expect(scoreElementWithStyle?.style.backgroundColor).toBe(
        'rgba(245, 158, 11, 0.8)'
      );
    });

    it('should apply correct background for low scores (<=0.4)', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [{ ...mockResult, score: 0.3 }],
      });

      renderComponent('test-task-id');

      // Target the score element with style attribute (the one in the image overlay)
      const scoreElements = screen.getAllByText('30.0%');
      const scoreElementWithStyle = scoreElements.find(
        (el) => el.style.backgroundColor
      );
      expect(scoreElementWithStyle).toBeInTheDocument();
      expect(scoreElementWithStyle?.style.backgroundColor).toBe(
        'rgba(0, 0, 0, 0.7)'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle result without frame_uuid or id', () => {
      const resultWithoutId = {
        ...mockResult,
        id: undefined,
        frame_uuid: undefined,
      };

      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [resultWithoutId],
      });

      expect(() => renderComponent('test-task-id')).not.toThrow();
    });

    it('should handle result with missing type', () => {
      const resultWithoutType = {
        ...mockResult,
        type: undefined,
      };

      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [resultWithoutType],
      });

      renderComponent('test-task-id');

      expect(screen.getByAltText('Forensic result')).toBeInTheDocument();
    });

    it('should handle pagination with many pages', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        totalPages: 10,
        currentPage: 5,
        results: [mockResult],
      });

      renderComponent('test-task-id');

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      // Test for ellipsis by checking if there are gaps in pagination
      expect(screen.queryByText('2')).not.toBeInTheDocument();
      expect(screen.queryByText('9')).not.toBeInTheDocument();
    });

    it('should handle empty results array', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [],
      });

      renderComponent('test-task-id');

      expect(document.querySelector('.grid')).toBeInTheDocument();
      expect(screen.queryByAltText('Forensic result')).not.toBeInTheDocument();
    });

    it('should handle missing imageData gracefully', () => {
      const resultWithNullImage = {
        ...mockResult,
        imageData: null,
      };

      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [resultWithNullImage],
      });

      renderComponent('test-task-id');

      expect(screen.getByText('forensic:display.no_image')).toBeInTheDocument();
      expect(screen.queryByAltText('Forensic result')).not.toBeInTheDocument();
    });

    it('should render timestamp correctly', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [mockResult],
      });

      renderComponent('test-task-id');

      // Check that timestamp appears in the card
      expect(screen.getByText('2024-01-01 10:00')).toBeInTheDocument();
    });
  });

  describe('Dialog Functionality', () => {
    it('should render clickable image cards that can trigger dialogs', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [mockResult],
      });

      renderComponent('test-task-id');

      // Find the image card (it's wrapped in a dialog trigger)
      const image = screen.getByAltText('Forensic result');
      expect(image).toBeInTheDocument();

      // Check that it's within a clickable container
      const dialogTrigger = image.closest('[data-state="closed"]');
      expect(dialogTrigger).toBeInTheDocument();
      expect(dialogTrigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('should have dialog structure in DOM even when closed', () => {
      mockUseSearchContext.mockReturnValue({
        ...defaultSearchContext,
        results: [mockResult],
      });

      renderComponent('test-task-id');

      // Check that dialog trigger is present using querySelector as fallback
      const dialogTrigger = document.querySelector('[aria-haspopup="dialog"]');
      expect(dialogTrigger).toBeInTheDocument();
      expect(dialogTrigger).toHaveAttribute('data-state', 'closed');
    });
  });

  describe('Component Structure', () => {
    it('should have proper structure when no taskId', () => {
      renderComponent();

      const noCamera = screen.getByText('forensic:display.no_camera');
      expect(noCamera).toBeInTheDocument();
      expect(noCamera.closest('.flex.flex-col')).toBeInTheDocument();
    });

    it('should have proper structure when taskId is provided', () => {
      renderComponent('test-task-id');

      expect(
        document.querySelector('.flex.flex-col.space-y-6')
      ).toBeInTheDocument();
      expect(document.querySelector('.grid')).toBeInTheDocument();
      expect(
        document.querySelector('.flex.justify-center')
      ).toBeInTheDocument();
    });
  });
});
