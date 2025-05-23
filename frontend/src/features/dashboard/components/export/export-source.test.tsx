import * as ReactQuery from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AcicEvent } from '../../lib/props';
import ExportStepSource from './export-source';

// Mock the getWidgetData function
vi.mock('../../lib/utils', () => ({
  getWidgetData: vi.fn(),
}));

// Setup mock for useQuery
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({
      data: [{ stream_id: 1 }],
      isSuccess: true,
      isFetching: false,
    }),
  };
});

describe('ExportStepSource', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.resetAllMocks();

    // Set default mock for useQuery
    const { useQuery } = ReactQuery;
    (useQuery as unknown as jest.Mock).mockReturnValue({
      data: [{ stream_id: 1 }],
      isSuccess: true,
      isFetching: false,
    });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      storedWidget: {
        table: AcicEvent.AcicCounting,
        range: {
          from: new Date('2023-01-01'),
          to: new Date('2023-01-31'),
        },
        stream: '0',
      },
      updateStoredWidget: vi.fn(),
      setStepValidity: vi.fn(),
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <ExportStepSource {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderComponent();

      expect(
        screen.getByText('dashboard:export:source.table')
      ).toBeInTheDocument();
      expect(
        screen.getByText('dashboard:export:source.range')
      ).toBeInTheDocument();
    });

    it('shows loading state when fetching stream data', () => {
      const { useQuery } = ReactQuery;
      (useQuery as unknown as jest.Mock).mockReturnValue({
        data: undefined,
        isSuccess: false,
        isFetching: true,
      });

      renderComponent();

      expect(
        screen.getByText('dashboard:export:source.fetchData')
      ).toBeInTheDocument();
    });

    it('shows no data message when no streams are available', () => {
      const { useQuery } = ReactQuery;
      (useQuery as unknown as jest.Mock).mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
      });

      renderComponent();

      expect(
        screen.getByText('dashboard:export:source.fetchDataError')
      ).toBeInTheDocument();
    });
  });
});
