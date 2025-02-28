import { z } from 'zod';
import { AcicEvent } from '../lib/props';

export const exportSchema = z
  .object({
    source: z.object({
      table: z.nativeEnum(AcicEvent),
      startDate: z.string(),
      endDate: z.string(),
      streams: z.array(z.number()),
    }),
    options: z.object({
      groupBy: z.string(),
      aggregation: z.string(),
      where: z
        .array(
          z.object({
            column: z.string(),
            value: z.string(),
          })
        )
        .optional(),
    }),
    format: z.enum(['Excel', 'PDF']),
  })
  .refine(
    (data) => {
      const start = new Date(data.source.startDate);
      const end = new Date(data.source.endDate);
      return start <= end;
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['source', 'startDate'],
    }
  );

export type ExportSchema = z.infer<typeof exportSchema>;
