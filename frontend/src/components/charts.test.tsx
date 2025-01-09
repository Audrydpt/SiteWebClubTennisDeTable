import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import {
  NameType,
  Payload,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import { describe, expect, it } from 'vitest';

import { AcicAggregation } from '@/features/dashboard/lib/props';
import {
  CustomChartLabel,
  CustomChartTickDate,
  CustomChartTickValue,
  CustomChartTooltip,
} from './charts';

type CustomPayload = Payload<ValueType, NameType> & {
  color?: string;
  stroke?: string;
  unit?: string;
  payload: {
    fill?: string;
  };
};

describe('Chart Utils', () => {
  describe('CustomChartTooltip', () => {
    it('renders with basic values', () => {
      const payload: CustomPayload = {
        value: 100,
        name: 'Test',
        color: '#ff0000',
        dataKey: 'test',
        payload: { fill: '#ff0000' },
      };

      const { container } = render(
        <div className="flex items-center gap-2">
          {CustomChartTooltip(100, 'Test', payload, 0, [payload])}
        </div>
      );

      expect(
        container.querySelector('.text-muted-foreground')
      ).toHaveTextContent('Test');
      expect(container.querySelector('.text-foreground')).toHaveTextContent(
        '100'
      );
    });

    it('handles percentage values correctly', () => {
      const payload: CustomPayload = {
        value: 0.75,
        name: 'Test',
        color: '#ff0000',
        unit: '%',
        dataKey: 'test',
        payload: { fill: '#ff0000' },
      };

      const { container } = render(
        <div className="flex items-center gap-2">
          {CustomChartTooltip(0.75, 'Test', payload, 0, [payload])}
        </div>
      );

      expect(container.querySelector('.text-foreground')).toHaveTextContent(
        '75 %'
      );
    });

    it('uses custom label from chartConfig when provided', () => {
      const payload: CustomPayload = {
        value: 100,
        name: 'test_key',
        color: '#ff0000',
        dataKey: 'test_key',
        payload: { fill: '#ff0000' },
      };

      const chartConfig = {
        test_key: { label: 'Custom Label' },
      };

      const { container } = render(
        <div className="flex items-center gap-2">
          {CustomChartTooltip(
            100,
            'test_key',
            payload,
            0,
            [payload],
            chartConfig
          )}
        </div>
      );

      expect(
        container.querySelector('.text-muted-foreground')
      ).toHaveTextContent('Custom Label');
    });

    it('uses color from different sources correctly', () => {
      const payload1: CustomPayload = {
        value: 100,
        name: 'Test',
        color: '#ff0000',
        dataKey: 'test',
        payload: { fill: '#000000' },
      };

      const payload2: CustomPayload = {
        value: 100,
        name: 'Test',
        stroke: '#00ff00',
        dataKey: 'test',
        payload: { fill: '#000000' },
      };

      const payload3: CustomPayload = {
        value: 100,
        name: 'Test',
        dataKey: 'test',
        payload: { fill: '#0000ff' },
      };

      const { container } = render(
        <>
          <div data-testid="color" className="flex items-center gap-2">
            {CustomChartTooltip(100, 'Test', payload1, 0, [payload1])}
          </div>
          <div data-testid="stroke" className="flex items-center gap-2">
            {CustomChartTooltip(100, 'Test', payload2, 0, [payload2])}
          </div>
          <div data-testid="fill" className="flex items-center gap-2">
            {CustomChartTooltip(100, 'Test', payload3, 0, [payload3])}
          </div>
        </>
      );

      const getColorFromStyle = (el: Element) => {
        const style = window.getComputedStyle(el);
        return style.getPropertyValue('--color-bg');
      };

      const colorBox1 = container.querySelector('[data-testid="color"] div');
      const colorBox2 = container.querySelector('[data-testid="stroke"] div');
      const colorBox3 = container.querySelector('[data-testid="fill"] div');

      expect(getColorFromStyle(colorBox1!)).toBe('#ff0000');
      expect(getColorFromStyle(colorBox2!)).toBe('#00ff00');
      expect(getColorFromStyle(colorBox3!)).toBe('#0000ff');
    });
  });

  describe('CustomChartTickValue', () => {
    it('formats regular numbers correctly', () => {
      expect(CustomChartTickValue('1000')).toBe('1,000 ');
      expect(CustomChartTickValue('1234.56')).toBe('1,234.56 ');
    });

    it('formats percentage values correctly', () => {
      expect(CustomChartTickValue('0.75', '%')).toBe('75 %');
      expect(CustomChartTickValue('0.5', '%')).toBe('50 %');
    });

    it('handles edge cases', () => {
      expect(CustomChartTickValue('0')).toBe('0 ');
      expect(CustomChartTickValue('-1000')).toBe('-1,000 ');
      expect(CustomChartTickValue('0', '%')).toBe('0 %');
    });
  });

  describe('CustomChartTickDate', () => {
    it('handles aggregation correctly', () => {
      const testDate = '2024-01-15T12:00:00.000Z';
      const format = 'yyyy-MM-dd';

      expect(CustomChartTickDate(testDate, format)).toBe(
        DateTime.fromISO(testDate).toFormat(format)
      );

      expect(
        CustomChartTickDate(testDate, format, AcicAggregation.OneHour)
      ).toBe(DateTime.fromISO(testDate).minus({ hours: 1 }).toFormat(format));

      expect(
        CustomChartTickDate(testDate, format, AcicAggregation.OneDay)
      ).toBe(DateTime.fromISO(testDate).minus({ days: 1 }).toFormat(format));
    });
  });

  describe('CustomChartLabel', () => {
    it('formats number values correctly', () => {
      expect(CustomChartLabel(1000, 'Count')).toBe('Count: 1,000');
      expect(CustomChartLabel(1234.56, 'Value')).toBe('Value: 1,234.56');
    });

    it('formats numeric strings correctly', () => {
      expect(CustomChartLabel('1000', 'Count')).toBe('Count: 1,000');
      expect(CustomChartLabel('1234.56', 'Value')).toBe('Value: 1,234.56');
    });

    it('handles non-numeric values', () => {
      expect(CustomChartLabel('N/A', 'Status')).toBe('N/A');
      expect(CustomChartLabel('', 'Empty')).toBe('');
    });

    it('handles edge cases', () => {
      expect(CustomChartLabel(0, 'Zero')).toBe('Zero: 0');
      expect(CustomChartLabel(-1000, 'Negative')).toBe('Negative: -1,000');
      expect(CustomChartLabel('invalid', 'Test')).toBe('invalid');
    });
  });
});
