import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PublicDashboard from './PublicDashboard';
import useWidgetAPI from './hooks/use-widget';

// Mock the custom hook
vi.mock('./hooks/use-widget', () => ({
  default: vi.fn(),
}));

// Mock chart components
vi.mock('./lib/const', () => ({
  ChartTypeComponents: {
    line: () => <div data-testid="line-chart">Line Chart Mock</div>,
    bar: () => <div data-testid="bar-chart">Bar Chart Mock</div>,
    pie: () => <div data-testid="pie-chart">Pie Chart Mock</div>,
  },
}));

describe('PublicDashboard', () => {
  const mockWidgets = [
    {
      id: 'widget-1',
      title: 'Widget 1',
      type: 'line',
      size: 'small',
      query: 'select * from table',
    },
    {
      id: 'widget-2',
      title: 'Widget 2',
      type: 'bar',
      size: 'medium',
      query: 'select * from table',
    },
    {
      id: 'widget-3',
      title: 'Widget 3',
      type: 'pie',
      size: 'large',
      query: 'select * from table',
    },
  ];

  describe('Loading States', () => {
    it('should show loading spinner when data is loading', () => {
      const mockHook = {
        query: { isLoading: true, isError: false, data: null },
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(<PublicDashboard dashboardKey="test-dashboard" />);

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should show error message when there is an error', () => {
      const mockHook = {
        query: { isLoading: false, isError: true, data: null },
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(<PublicDashboard dashboardKey="test-dashboard" />);

      expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
    });

    it('should show no widgets message when data is empty', () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: [] },
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(<PublicDashboard dashboardKey="test-dashboard" />);

      expect(screen.getByText(/Aucun widget disponible/i)).toBeInTheDocument();
    });
  });

  describe('Widget Rendering', () => {
    it('should render all widgets with correct layout classes', () => {
      const mockHook = {
        query: { isLoading: false, isError: false, data: mockWidgets },
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(<PublicDashboard dashboardKey="test-dashboard" />);

      // Check if all widgets are rendered
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

      // Check if correct number of widgets are rendered
      const widgetContainers = document.querySelectorAll('[data-id]');
      expect(widgetContainers).toHaveLength(3);

      // Check container for first widget (small)
      const smallWidget = document.querySelector('[data-id="widget-1"]');
      expect(smallWidget).toHaveClass(
        'col-span-1',
        'md:col-span-1',
        'lg:col-span-1',
        '2xl:col-span-2'
      );
      expect(smallWidget).toHaveClass('row-span-1');

      // Check container for second widget (medium)
      const mediumWidget = document.querySelector('[data-id="widget-2"]');
      expect(mediumWidget).toHaveClass(
        'col-span-1',
        'md:col-span-1',
        'lg:col-span-2',
        '2xl:col-span-3'
      );
      expect(mediumWidget).toHaveClass('row-span-1');

      // Check container for third widget (large)
      const largeWidget = document.querySelector('[data-id="widget-3"]');
      expect(largeWidget).toHaveClass(
        'col-span-1',
        'md:col-span-2',
        'lg:col-span-3',
        '2xl:col-span-4'
      );
      expect(largeWidget).toHaveClass('row-span-2');
    });

    it('should filter out widgets with unknown chart types', () => {
      const widgetsWithInvalidType = [
        ...mockWidgets,
        {
          id: 'widget-4',
          title: 'Invalid Widget',
          type: 'unknown-type',
          size: 'small',
          query: 'select * from table',
        },
      ];

      const mockHook = {
        query: {
          isLoading: false,
          isError: false,
          data: widgetsWithInvalidType,
        },
      };
      (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

      render(<PublicDashboard dashboardKey="test-dashboard" />);

      // Only the valid widgets should be rendered
      const widgetContainers = document.querySelectorAll('[data-id]');
      expect(widgetContainers).toHaveLength(3);
    });
  });

  it('should pass the correct dashboardKey to useWidgetAPI', () => {
    const mockHook = {
      query: { isLoading: false, isError: false, data: mockWidgets },
    };
    (useWidgetAPI as ReturnType<typeof vi.fn>).mockReturnValue(mockHook);

    render(<PublicDashboard dashboardKey="custom-dashboard-key" />);

    expect(useWidgetAPI).toHaveBeenCalledWith('custom-dashboard-key');
  });
});
