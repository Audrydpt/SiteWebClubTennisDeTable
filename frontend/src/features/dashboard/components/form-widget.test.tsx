import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest';
import { AcicAggregation, AcicEvent, ChartSize, ChartType } from '../lib/props';

import { FormWidget } from './form-widget';

// Mock translation function to return keys as-is
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock chart components to prevent test errors
vi.mock('../components/charts/bar', () => ({
  default: () => <div>Bar Chart Mock</div>,
}));

// Partially mock utils module to override getWidgetDescription only
vi.mock('../lib/utils', () => ({
  getWidgetDescription: vi.fn().mockResolvedValue({
    [AcicEvent.AcicCounting]: ['column1', 'column2'],
  }),
  // Add these required functions that are used by chart components
  getTimeFormattingConfig: vi
    .fn()
    .mockReturnValue({ format: 'HH:mm', interval: 1 }),
  chartSizePoints: {
    [ChartSize.tiny]: 6,
    [ChartSize.small]: 8,
    [ChartSize.medium]: 10,
    [ChartSize.large]: 12,
    [ChartSize.big]: 16,
    [ChartSize.full]: 20,
  },
  // Mock hasTooManyPoints function to return true for OneMinute + OneYear
  hasTooManyPoints: (aggregation: AcicAggregation, duration: AcicAggregation) =>
    aggregation === AcicAggregation.OneMinute &&
    duration === AcicAggregation.OneYear,
}));

describe('FormWidget', () => {
  // Setup a QueryClientProvider wrapper for React Query
  const queryClient = new QueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  let onSubmit: ReturnType<typeof vi.fn>;

  const renderComponent = (props: Record<string, unknown> = {}) => {
    onSubmit = vi.fn();
    return render(
      <Wrapper>
        <FormWidget onSubmit={onSubmit} {...props}>
          <button type="button">Open</button>
        </FormWidget>
      </Wrapper>
    );
  };

  describe('Basic Rendering', () => {
    it('renders trigger element and no dialog by default', () => {
      renderComponent();
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('Interaction Tests', () => {
    it('opens dialog on trigger click and renders form fields', async () => {
      renderComponent();
      const user = userEvent.setup();

      // Open the dialog
      await user.click(screen.getByText('Open'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Fill in required fields
      const titleInput = screen.getByRole('textbox');
      await user.clear(titleInput);
      await user.type(titleInput, 'My Widget');

      // Verify submit button is present
      expect(
        screen.getByRole('button', { name: 'submit' })
      ).toBeInTheDocument();

      // Note: we're not testing actual form submission as the component uses complex
      // dialog/form setup that's difficult to simulate in tests
    }, 10000);
  });

  describe('Edge Cases', () => {
    it('shows alert when too many points for given aggregation and duration', async () => {
      // Use defaultValues that trigger too many points alert
      const defaultValues = {
        title: 'Test',
        type: ChartType.Bar,
        layout: 'monotone',
        table: AcicEvent.AcicCounting,
        aggregation: AcicAggregation.OneMinute,
        duration: AcicAggregation.OneYear,
        size: ChartSize.medium,
        where: [],
      };
      renderComponent({ defaultValues });
      const user = userEvent.setup();
      await user.click(screen.getByText('Open'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Wait for alert to appear in preview
      const alert = await screen.findByRole('alert');
      // Check alert contents
      expect(within(alert).getByText('Too many points!')).toBeInTheDocument();
      expect(
        within(alert).getByText(
          'Aggregation period is too small for the given duration'
        )
      ).toBeInTheDocument();
    });
  });
});
