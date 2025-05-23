import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WidgetRangeNavigation from './widget-range-navigation';

describe('WidgetRangeNavigation', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {
      page: 1,
      onPageChange: vi.fn(),
    };

    return render(<WidgetRangeNavigation {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders previous and next buttons', () => {
      renderComponent();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('calls onPageChange with page - 1 when previous button is clicked', () => {
      const onPageChange = vi.fn();
      renderComponent({ page: 2, onPageChange });

      fireEvent.click(screen.getByLabelText('Previous page'));

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange with page + 1 when next button is clicked', () => {
      const onPageChange = vi.fn();
      renderComponent({ page: 1, onPageChange });

      fireEvent.click(screen.getByLabelText('Next page'));

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('does not call onPageChange when next button is clicked and page is 0', () => {
      const onPageChange = vi.fn();
      renderComponent({ page: 0, onPageChange });

      fireEvent.click(screen.getByLabelText('Next page'));

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('resets to page 0 after inactivity timeout', () => {
      const onPageChange = vi.fn();
      renderComponent({ onPageChange });

      act(() => {
        vi.advanceTimersByTime(20000);
      });

      expect(onPageChange).toHaveBeenCalledWith(0);
    });

    it('resets inactivity timer when interacting with navigation', () => {
      const onPageChange = vi.fn();
      renderComponent({ page: 1, onPageChange });

      // Clear initial timer setup calls
      onPageChange.mockClear();

      // Advance time partially
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Click next to reset timer
      fireEvent.click(screen.getByLabelText('Next page'));

      // Verify next page was triggered
      expect(onPageChange).toHaveBeenCalledWith(2);
      onPageChange.mockClear();

      // Advance time partially again - this shouldn't trigger timeout yet
      act(() => {
        vi.advanceTimersByTime(15000);
      });
      expect(onPageChange).not.toHaveBeenCalled();

      // Advance remaining time to trigger timeout
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Now the timeout should have triggered
      expect(onPageChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Edge Cases', () => {
    it('cleans up timeout on unmount', () => {
      const onPageChange = vi.fn();
      const { unmount } = renderComponent({ onPageChange });

      // Clear initial setup calls
      onPageChange.mockClear();

      // Unmount component
      unmount();

      // Advance time past timeout
      act(() => {
        vi.advanceTimersByTime(20000);
      });

      // Verify timeout callback wasn't called after unmount
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });
});
