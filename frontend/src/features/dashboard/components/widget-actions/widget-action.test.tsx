import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JSX } from 'react';
import { vi } from 'vitest';

import {
  AcicAggregation,
  AcicEvent,
  ChartSize,
  ChartType,
} from '../../lib/props';
import type { StoredWidget } from '../form-widget';
import WidgetActions from './widget-actions';

// Mock dependencies
vi.mock('@/components/confirm-delete', () => ({
  default: ({
    children,
    onDelete,
  }: {
    children: JSX.Element;
    onDelete: () => void;
  }) => (
    <div
      data-testid="delete-confirmation"
      onClick={onDelete}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onDelete();
        }
      }}
    >
      {children}
    </div>
  ),
}));

vi.mock('./form-widget', () => ({
  FormWidget: ({
    children,
    onSubmit,
    defaultValues,
  }: {
    children: JSX.Element;
    onSubmit: (data: StoredWidget) => void;
    defaultValues: StoredWidget;
  }) => (
    <div
      data-testid="form-widget"
      onClick={() => onSubmit(defaultValues)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSubmit(defaultValues);
        }
      }}
    >
      {children}
    </div>
  ),
}));

vi.mock('./quick-export', () => ({
  default: ({
    children,
    updateStoredWidget,
    storedWidget,
  }: {
    children: JSX.Element;
    updateStoredWidget: (data: StoredWidget) => void;
    storedWidget: StoredWidget;
  }) => (
    <div
      data-testid="quick-export"
      onClick={() => updateStoredWidget(storedWidget)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          updateStoredWidget(storedWidget);
        }
      }}
    >
      {children}
    </div>
  ),
}));

describe('WidgetActions', () => {
  // Create a mock that matches the StoredWidget type
  const mockStoredWidget: StoredWidget = {
    id: 'widget-1',
    title: 'Test Widget',
    table: AcicEvent.AcicCounting,
    type: ChartType.Bar,
    aggregation: AcicAggregation.OneHour,
    duration: AcicAggregation.OneDay,
    where: [{ column: 'test', value: 'value' }],
    size: ChartSize.medium,
    layout: 'monotone',
  };

  const mockItem = {
    id: 'tile-1',
    content: <div>Chart Content</div>,
    widget: mockStoredWidget,
  };

  const mockChartRef = document.createElement('div');

  const renderComponent = (props = {}) => {
    const defaultProps = {
      isOperator: false,
      item: mockItem,
      chartRef: mockChartRef,
      edit: vi.fn(),
      remove: vi.fn(),
      clone: vi.fn(),
      page: 1,
    };

    return render(<WidgetActions {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      // Look for the wrapper div
      const wrapper = screen
        .getByRole('button', { name: 'Delete' })
        .closest('div')?.parentElement;
      expect(wrapper).toBeInTheDocument();
    });

    it('applies correct styling', () => {
      renderComponent();
      // Look for the wrapper
      const container = screen
        .getByRole('button', { name: 'Delete' })
        .closest('div')?.parentElement;
      expect(container).toHaveClass(
        'absolute',
        'top-2',
        'right-2',
        'flex',
        'gap-2'
      );
    });

    it('hides all buttons when isOperator is true', () => {
      renderComponent({ isOperator: true });
      // The container should be empty
      const deleteButton = screen.queryByRole('button', { name: 'Delete' });
      expect(deleteButton).not.toBeInTheDocument();
    });

    it('shows all buttons when isOperator is false', () => {
      renderComponent();
      // Check for the presence of our wrapped components
      expect(screen.getByTestId('quick-export')).toBeInTheDocument();
      expect(screen.getByTestId('form-widget')).toBeInTheDocument();
      expect(screen.getByTestId('delete-confirmation')).toBeInTheDocument();

      // Should have a Delete button
      expect(
        screen.getByRole('button', { name: 'Delete' })
      ).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('calls clone function when Clone button is clicked', async () => {
      const user = userEvent.setup();
      const cloneFn = vi.fn();
      renderComponent({ clone: cloneFn });

      // Find the button with area-label
      const buttons = screen.getAllByRole('button');
      // Find the clone button by looking at all buttons that have area-label="Clone"
      const cloneButton = Array.from(buttons).find(
        (btn) => btn.getAttribute('area-label') === 'Clone'
      );

      expect(cloneButton).not.toBeUndefined();
      if (cloneButton) {
        await user.click(cloneButton);
        expect(cloneFn).toHaveBeenCalledWith(mockStoredWidget);
      }
    });

    it('calls edit function when Edit button is clicked', async () => {
      const user = userEvent.setup();
      const editFn = vi.fn();
      renderComponent({ edit: editFn });

      const formWidget = screen.getByTestId('form-widget');
      await user.click(formWidget);

      expect(editFn).toHaveBeenCalledWith({
        ...mockStoredWidget,
        ...mockStoredWidget,
      });
    });

    it('calls remove function when Delete button is clicked', async () => {
      const user = userEvent.setup();
      const removeFn = vi.fn();
      renderComponent({ remove: removeFn });

      const deleteConfirmation = screen.getByTestId('delete-confirmation');
      await user.click(deleteConfirmation);

      expect(removeFn).toHaveBeenCalledWith(mockItem.id);
    });

    it('calls edit function when Export button is clicked', async () => {
      const user = userEvent.setup();
      const editFn = vi.fn();
      renderComponent({ edit: editFn });

      const quickExport = screen.getByTestId('quick-export');
      await user.click(quickExport);

      expect(editFn).toHaveBeenCalledWith({
        ...mockStoredWidget,
        ...mockStoredWidget,
      });
    });
  });

  describe('Edge Cases', () => {
    it('works without optional chartRef prop', () => {
      renderComponent({ chartRef: undefined });
      expect(screen.getByTestId('quick-export')).toBeInTheDocument();
    });
  });
});
