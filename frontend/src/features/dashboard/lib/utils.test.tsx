import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AcicAggregation, AcicEvent, ChartSize, ChartType } from './props';
import {
  chartSizePoints,
  getDashboards,
  getDashboardWidgets,
  getDurationInDays,
  getTimeFormattingConfig,
  getWidgetData,
  getWidgetDescription,
  roundDateTime,
  setDashboardWidgets,
} from './utils';

// Mock environment variables
const API_URL = 'http://test-api.local';

vi.stubEnv('MAIN_API_URL', API_URL);

// Mock fetch globally
const mockFetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);
global.fetch = mockFetch;

describe('getDurationInDays', () => {
  it('converts minutes to days correctly', () => {
    expect(getDurationInDays(AcicAggregation.OneMinute)).toBe(1 / 24 / 60);
    expect(getDurationInDays(AcicAggregation.FifteenMinutes)).toBe(
      15 / 24 / 60
    );
    expect(getDurationInDays(AcicAggregation.ThirtyMinutes)).toBe(30 / 24 / 60);
  });

  it('converts hours to days correctly', () => {
    expect(getDurationInDays(AcicAggregation.OneHour)).toBe(1 / 24);
  });

  it('handles days correctly', () => {
    expect(getDurationInDays(AcicAggregation.OneDay)).toBe(1);
  });

  it('converts weeks to days correctly', () => {
    expect(getDurationInDays(AcicAggregation.OneWeek)).toBe(7);
  });

  it('converts months to days correctly', () => {
    expect(getDurationInDays(AcicAggregation.OneMonth)).toBe(30);
    expect(getDurationInDays(AcicAggregation.SixMonths)).toBe(180);
  });

  it('converts years to days correctly', () => {
    expect(getDurationInDays(AcicAggregation.OneYear)).toBe(365);
    expect(getDurationInDays(AcicAggregation.LifeTime)).toBe(36500);
  });

  it('returns default value for unknown duration', () => {
    expect(getDurationInDays('invalid duration' as AcicAggregation)).toBe(1);
  });
});

describe('chartSizePoints', () => {
  it('has correct points for each size', () => {
    expect(chartSizePoints[ChartSize.tiny]).toBe(6);
    expect(chartSizePoints[ChartSize.small]).toBe(8);
    expect(chartSizePoints[ChartSize.medium]).toBe(10);
    expect(chartSizePoints[ChartSize.large]).toBe(12);
    expect(chartSizePoints[ChartSize.big]).toBe(16);
    expect(chartSizePoints[ChartSize.full]).toBe(20);
  });
});

describe('getTimeFormattingConfig', () => {
  it('returns correct format for durations less than 1 day', () => {
    const result = getTimeFormattingConfig(
      AcicAggregation.OneHour,
      24,
      ChartSize.medium
    );
    expect(result.format).toBe('HH:mm');
  });

  it('returns correct format for durations between 1-7 days', () => {
    const result = getTimeFormattingConfig(
      AcicAggregation.OneWeek,
      24,
      ChartSize.medium
    );
    expect(result.format).toBe('ccc dd');
  });

  it('adjusts format based on data length', () => {
    const result = getTimeFormattingConfig(
      AcicAggregation.OneWeek,
      72,
      ChartSize.medium
    );
    expect(result.format).toBe('ccc dd');
  });

  it('calculates interval correctly based on size and data length', () => {
    const result = getTimeFormattingConfig(
      AcicAggregation.OneDay,
      100,
      ChartSize.medium
    );
    expect(result.interval).toBe(10); // 100 points / 10 target points
  });

  it('returns correct format for durations of 30 days', () => {
    const result = getTimeFormattingConfig(
      AcicAggregation.OneMonth,
      30,
      ChartSize.medium
    );
    expect(result.format).toBe('dd LLL');
  });

  it('returns correct format for durations of 180 days', () => {
    const result = getTimeFormattingConfig(
      AcicAggregation.SixMonths,
      180,
      ChartSize.medium
    );
    expect(result.format).toBe('dd LLL');
  });

  it('returns default format for very long durations', () => {
    const result = getTimeFormattingConfig(
      AcicAggregation.OneYear,
      365,
      ChartSize.medium
    );
    expect(result.format).toBe('LLL yyyy');
  });
});

describe('roundDateTime', () => {
  const testDate = DateTime.fromISO('2024-03-15T14:30:45.123', {
    zone: 'UTC',
  });

  it('rounds to minute', () => {
    const result = roundDateTime(testDate, AcicAggregation.OneMinute);
    expect(result.toUTC().toISO()).toBe('2024-03-15T14:30:00.000Z');
  });

  it('rounds to 15 minutes', () => {
    const result = roundDateTime(testDate, AcicAggregation.FifteenMinutes);
    expect(result.toUTC().toISO()).toBe('2024-03-15T14:30:00.000Z');
  });

  it('rounds to 30 minutes', () => {
    const result = roundDateTime(testDate, AcicAggregation.ThirtyMinutes);
    expect(result.toUTC().toISO()).toBe('2024-03-15T14:30:00.000Z');
  });

  it('rounds to hour', () => {
    const result = roundDateTime(testDate, AcicAggregation.OneHour);
    expect(result.toUTC().toISO()).toBe('2024-03-15T14:00:00.000Z');
  });

  it('rounds to day', () => {
    const result = roundDateTime(testDate, AcicAggregation.OneDay);
    expect(result.toUTC().toISO()).toBe('2024-03-15T00:00:00.000Z');
  });

  it('rounds to week', () => {
    const result = roundDateTime(testDate, AcicAggregation.OneWeek);
    // March 11, 2024 is the start of that week (Monday)
    expect(result.toUTC().toISO()).toBe('2024-03-11T00:00:00.000Z');
  });

  it('rounds to month', () => {
    const result = roundDateTime(testDate, AcicAggregation.OneMonth);
    expect(result.toUTC().toISO()).toBe('2024-03-01T00:00:00.000Z');
  });

  it('rounds to 6 months', () => {
    const result = roundDateTime(testDate, AcicAggregation.SixMonths);
    expect(result.toUTC().toISO()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('rounds to year', () => {
    const result = roundDateTime(testDate, AcicAggregation.OneYear);
    expect(result.toUTC().toISO()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('rounds to 100 years', () => {
    const result = roundDateTime(testDate, AcicAggregation.LifeTime);
    expect(result.toUTC().toISO()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('returns original date for unknown aggregation', () => {
    const result = roundDateTime(testDate, 'invalid' as AcicAggregation);
    expect(result.toUTC().toISO()).toBe(testDate.toUTC().toISO());
  });
});

describe('API calls', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Reset environment variables before each test
    vi.stubEnv('MAIN_API_URL', API_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getWidgetDescription', () => {
    it('calls correct endpoint and returns data', async () => {
      const mockData = { widgets: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await getWidgetDescription();
      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/dashboard/widgets`);
      expect(result).toEqual(mockData);
    });
  });

  describe('getWidgetData', () => {
    const baseProps = {
      table: 'test-table',
      aggregation: AcicAggregation.OneHour,
      duration: AcicAggregation.OneDay,
    };

    it('constructs correct URL with basic parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getWidgetData(baseProps);

      const lastCall = mockFetch.mock.calls[
        mockFetch.mock.calls.length - 1
      ][0] as string;
      expect(lastCall).toContain('/dashboard/widgets/test-table');
      expect(lastCall).toContain('aggregate=1 hour');
      expect(lastCall).toMatch(/time_from=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(lastCall).toMatch(/time_to=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('includes group by parameter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getWidgetData(baseProps, 'category');

      const lastCall = mockFetch.mock.calls[
        mockFetch.mock.calls.length - 1
      ][0] as string;
      expect(lastCall).toContain('group_by=category');
    });

    it('handles where clauses correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getWidgetData({
        ...baseProps,
        where: [{ column: 'status', value: 'active' }],
      });

      const lastCall = mockFetch.mock.calls[
        mockFetch.mock.calls.length - 1
      ][0] as string;
      expect(lastCall).toContain('status=active');
    });

    it('handles multiple values in where clause', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getWidgetData({
        ...baseProps,
        where: [{ column: 'status', value: 'active|||pending' }],
      });

      const lastCall = mockFetch.mock.calls[
        mockFetch.mock.calls.length - 1
      ][0] as string;
      expect(lastCall).toContain('status=active');
      expect(lastCall).toContain('status=pending');
    });

    it('throws error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(getWidgetData(baseProps)).rejects.toThrow('Not Found');
    });
  });

  describe('getDashboards', () => {
    it('fetches dashboards correctly', async () => {
      const mockData = { dashboard1: { title: 'Dashboard 1' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await getDashboards();
      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/dashboard/tabs`);
      expect(result).toEqual(mockData);
    });
  });

  describe('Dashboard Widgets', () => {
    const mockWidgets = [
      {
        id: '1',
        size: ChartSize.medium,
        type: ChartType.Line,
        table: AcicEvent.AcicAllInOneEvent,
        aggregation: AcicAggregation.OneHour,
        duration: AcicAggregation.OneDay,
        layout: 'default',
        title: 'Widget 1',
        order: 0,
      },
    ];

    it('fetches dashboard widgets correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWidgets),
      });

      const result = await getDashboardWidgets('dashboard1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/dashboard/tabs/dashboard1/widgets`
      );
      expect(result).toEqual(mockWidgets);
    });

    it('sets dashboard widgets correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await setDashboardWidgets('dashboard1', mockWidgets);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/dashboard/tabs/dashboard1/widgets`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            mockWidgets.map((widget, index) => ({ ...widget, order: index }))
          ),
        }
      );
    });
  });
});
