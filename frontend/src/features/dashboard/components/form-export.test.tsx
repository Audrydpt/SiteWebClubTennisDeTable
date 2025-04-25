import { describe, expect, it } from 'vitest';
import { AcicEvent } from '../lib/props';
import { exportSchema, ExportSchema } from './form-export';

describe('exportSchema', () => {
  const validBase: ExportSchema = {
    source: {
      table: AcicEvent.AcicCounting,
      startDate: '2023-01-01',
      endDate: '2023-01-02',
      streams: [1, 2, 3],
    },
    options: {
      groupBy: 'group',
      aggregation: 'agg',
      where: [{ column: 'col1', value: 'val1' }],
    },
    format: 'Excel',
  };

  it('parses valid data successfully', () => {
    const result = exportSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validBase);
    }
  });

  it('parses valid data without where clause', () => {
    const { source, options, format } = validBase;
    const dataWithoutWhere = {
      source,
      options: {
        groupBy: options.groupBy,
        aggregation: options.aggregation,
      },
      format,
    };
    const result = exportSchema.safeParse(dataWithoutWhere as ExportSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.options.where).toBeUndefined();
    }
  });

  it('fails when startDate is after endDate', () => {
    const invalidDates = {
      ...validBase,
      source: {
        ...validBase.source,
        startDate: '2023-02-01',
        endDate: '2023-01-01',
      },
    };
    const result = exportSchema.safeParse(invalidDates);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) =>
          i.path[0] === 'source' &&
          i.path[1] === 'startDate' &&
          i.message === 'Start date must be before or equal to end date'
      );
      expect(issue).toBeDefined();
    }
  });

  it('fails when format is invalid', () => {
    const invalidFormat = {
      ...validBase,
      format: 'CSV' as unknown as ExportSchema['format'],
    };
    const result = exportSchema.safeParse(invalidFormat);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'format');
      expect(issue).toBeDefined();
    }
  });

  it('fails when required fields are missing', () => {
    const missingFieldsData = {} as Partial<ExportSchema>;
    const result = exportSchema.safeParse(missingFieldsData as ExportSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
