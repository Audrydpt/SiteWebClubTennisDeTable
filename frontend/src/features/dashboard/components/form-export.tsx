import { z } from 'zod';
import { AcicEvent } from '../lib/props';

const formSchema = z.object({
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
});

export type ExportSchema = z.infer<typeof formSchema>;

export default formSchema;
