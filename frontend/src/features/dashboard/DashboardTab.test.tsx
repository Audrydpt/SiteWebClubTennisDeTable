import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StoredWidget } from './components/form-widget';
import DashboardTab, { ChartTiles } from './DashboardTab';
import useWidgetAPI from './hooks/use-widget';
import { AcicAggregation, AcicEvent, ChartSize, ChartType } from './lib/props';

// Mock the custom hooks
vi.mock('./hooks/use-widget', () => ({
  default: vi.fn(),
}));

// Mock the form widget
vi.mock('./components/form-widget', () => ({
  FormWidget: () => <div data-testid="mock-form-widget">Mock form widget</div>,
}));

// Mock react-sortablejs
let reorderedWidgets: ChartTiles[] = [];
const convertToChartTiles = (widgets: StoredWidget[]): ChartTiles[] =>
  widgets.map(
    (widget, index) =>
      ({
        id: widget.id,
        widget: { ...widget, order: index } as StoredWidget,
      }) as ChartTiles
  );

vi.mock('react-sortablejs', () => ({
  ReactSortable: ({
    children,
    setList,
  }: {
    children: React.ReactNode;
    setList: (newState: ChartTiles[]) => void;
  }) => (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      data-testid="sortable-container"
      onClick={() => setList(reorderedWidgets)}
    >
      {children}
    </div>
  ),
}));

describe('DashboardTab', () => {
  const mockWidgets = [
    {
      id: 'widget-1',
      title: 'First Widget',
      type: ChartType.Line,
      size: ChartSize.medium,
      order: 0,

      table: AcicEvent.AcicAllInOneEvent,
      aggregation: AcicAggregation.OneHour,
      duration: AcicAggregation.OneDay,
      layout: 'default',
    },
    {
      id: 'widget-2',
      title: 'Second Widget',
      type: ChartType.Bar,
      size: ChartSize.large,
      order: 1,

      table: AcicEvent.AcicAllInOneEvent,
      aggregation: AcicAggregation.OneHour,
      duration: AcicAggregation.OneDay,
      layout: 'default',
    },
  ] as StoredWidget[];

  const mockOnAddWidget = vi.fn();

  const getParentElementByText = (text: string) =>
    screen.getByText(text).parentElement?.parentElement?.parentElement;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should show loading spinner when data is loading', () => {
      const mockHook = {
        query: { isLoading: true, isError: false, data: null },
        add: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        patch: vi.fn(),
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <DashboardTab
          dashboardKey="test-dashboard"
          onAddWidget={mockOnAddWidget}
        />
      );

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should show error message when there is an error', () => {
      const mockHook = {
        query: { isLoading: false, isError: true, data: null },
        add: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        patch: vi.fn(),
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <DashboardTab
          dashboardKey="test-dashboard"
          onAddWidget={mockOnAddWidget}
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Widget Rendering', () => {
    it('should render all widgets correctly', () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockWidgets },
        add: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        patch: vi.fn(),
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <DashboardTab
          dashboardKey="test-dashboard"
          onAddWidget={mockOnAddWidget}
        />
      );

      expect(screen.getByText('First Widget')).toBeInTheDocument();
      expect(screen.getByText('Second Widget')).toBeInTheDocument();
    });

    it('should apply correct size classes to widgets', () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockWidgets },
        add: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        patch: vi.fn(),
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <DashboardTab
          dashboardKey="test-dashboard"
          onAddWidget={mockOnAddWidget}
        />
      );

      const firstWidget = getParentElementByText('First Widget');
      const secondWidget = getParentElementByText('Second Widget');

      expect(firstWidget).toHaveClass('col-span-1', 'lg:col-span-2');
      expect(secondWidget).toHaveClass('col-span-1', 'lg:col-span-3');
    });
  });

  describe('Widget Actions', () => {
    it('should show delete buttons when hovering', async () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockWidgets },
        add: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        patch: vi.fn(),
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <DashboardTab
          dashboardKey="test-dashboard"
          onAddWidget={mockOnAddWidget}
        />
      );

      const widgetContainer = getParentElementByText('First Widget');
      expect(widgetContainer).toBeInTheDocument();

      if (widgetContainer) {
        const actionsContainer = widgetContainer.querySelector('.opacity-0');
        expect(actionsContainer).toBeInTheDocument();
        expect(actionsContainer).toHaveClass(
          'opacity-0',
          'group-hover:opacity-100'
        );

        const button = within(widgetContainer).getByLabelText('Delete');
        expect(button).toBeInTheDocument();
      }
    });

    it('should open delete confirmation when delete button is clicked', async () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockWidgets },
        add: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        patch: vi.fn(),
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <DashboardTab
          dashboardKey="test-dashboard"
          onAddWidget={mockOnAddWidget}
        />
      );

      const widgetContainer = getParentElementByText('First Widget');
      if (widgetContainer) {
        await userEvent.hover(widgetContainer);

        const button = within(widgetContainer).getByLabelText('Delete');
        await userEvent.click(button);

        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toBeInTheDocument();
      }
    });

    it('should call remove function when deletion is confirmed', async () => {
      const mockRemove = vi.fn();
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockWidgets },
        add: vi.fn(),
        edit: vi.fn(),
        remove: mockRemove,
        patch: vi.fn(),
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <DashboardTab
          dashboardKey="test-dashboard"
          onAddWidget={mockOnAddWidget}
        />
      );

      const widgetContainer = getParentElementByText('First Widget');
      if (widgetContainer) {
        await userEvent.hover(widgetContainer);

        const button = within(widgetContainer).getByLabelText('Delete');
        await userEvent.click(button);

        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toBeInTheDocument();

        const confirm = within(dialog).getByText('delete');
        await userEvent.click(confirm);

        expect(mockRemove).toHaveBeenCalledWith('widget-1');
      }
    });
  });

  describe('Widget Sorting', () => {
    it('should call patch with correctly reordered widgets when widgets are reordered', async () => {
      const mockPatch = vi.fn();
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockWidgets },
        add: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        patch: mockPatch,
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <DashboardTab
          dashboardKey="test-dashboard"
          onAddWidget={mockOnAddWidget}
        />
      );

      const sortableContainer = screen.getByTestId('sortable-container');

      // Simulate reordering by triggering setList with reordered widgets
      reorderedWidgets = convertToChartTiles([mockWidgets[1], mockWidgets[0]]);
      await userEvent.click(sortableContainer);

      expect(mockPatch).toHaveBeenCalledWith({
        oldData: mockWidgets,
        newData: [
          { ...mockWidgets[1], order: 0 },
          { ...mockWidgets[0], order: 1 },
        ],
      });
    });

    it('should not call patch when widgets are returned to their original order', async () => {
      const mockPatch = vi.fn();
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockWidgets },
        add: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        patch: mockPatch,
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(
        <DashboardTab
          dashboardKey="test-dashboard"
          onAddWidget={mockOnAddWidget}
        />
      );

      const sortableContainer = screen.getByTestId('sortable-container');

      // Simulate reordering by triggering setList with reordered widgets
      reorderedWidgets = convertToChartTiles([mockWidgets[0], mockWidgets[1]]);
      await userEvent.click(sortableContainer);

      // Ne doit pas être appelé
      expect(mockPatch).not.toBeCalled();
    });
  });
});
