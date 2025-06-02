/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';

export interface ForensicResult {
  id: string;
  imageData: string;
  frame_uuid?: string;
  timestamp: Date;
  score: number;
  progress?: number;
  cameraId: string;
  type?: string;
  source?: string;
  camera?: string;
  attributes?: {
    color?: Record<string, number>;
    type?: Record<string, number>;
    [key: string]: unknown;
  };
  metadata?: Record<string, any>;
}

export interface SourceProgress {
  sourceId: string;
  progress: number;
  timestamp: Date;
  startTime?: Date;
}

// Définition des schémas Zod
// Structure commune de base
// Change the baseForensicSchema definition
const baseForensicSchema = z.object({
  // Change this to use a min validation instead of nonempty
  sources: z.array(z.string()).min(1, {
    message: 'Veuillez sélectionner au moins une source vidéo',
  }),
  timerange: z
    .object({
      time_from: z.string().datetime(),
      time_to: z.string().datetime(),
    })
    .default({
      time_from: new Date().toISOString(),
      time_to: new Date().toISOString(),
    }),
  context: z.record(z.any()).default({}),
});

// Schéma pour le véhicule
export const vehicleForensicSchema = baseForensicSchema.extend({
  type: z.literal('vehicle'),
  appearances: z.object({
    type: z.array(z.string()).nullable().optional(),
    color: z
      .array(
        z.enum([
          'brown',
          'red',
          'orange',
          'yellow',
          'green',
          'cyan',
          'blue',
          'purple',
          'pink',
          'white',
          'gray',
          'black',
        ])
      )
      .default([]),
    confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  attributes: z.object({
    mmr: z
      .array(
        z.object({
          brand: z.string(),
          model: z.array(z.string()).nullable().optional(),
        })
      )
      .default([]),
    plate: z.string().nullable().optional(),
    other: z.record(z.boolean()).default({}),
    confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
});

// Schéma pour la personne
export const personForensicSchema = baseForensicSchema.extend({
  type: z.literal('person'),
  appearances: z.object({
    gender: z
      .array(z.enum(['male', 'female']))
      .nullable()
      .optional(),
    seenAge: z
      .array(z.enum(['child', 'adult', 'senior']))
      .nullable()
      .optional(),
    realAge: z.number().int().nullable().optional(),
    build: z
      .array(z.enum(['slim', 'average', 'athletic', 'heavy']))
      .nullable()
      .optional(),
    height: z
      .array(z.enum(['short', 'average', 'tall']))
      .nullable()
      .optional(),
    hair: z
      .object({
        length: z
          .array(z.enum(['none', 'short', 'medium', 'long']))
          .nullable()
          .optional(),
        color: z
          .array(z.enum(['black', 'brown', 'blonde', 'gray', 'white', 'other']))
          .nullable()
          .optional(),
        style: z
          .array(z.enum(['straight', 'wavy', 'curly']))
          .nullable()
          .optional(),
      })
      .default({
        length: [],
        color: [],
        style: [],
      }),
    confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  attributes: z.object({
    upper: z
      .object({
        color: z
          .array(
            z.enum([
              'brown',
              'red',
              'orange',
              'yellow',
              'green',
              'cyan',
              'blue',
              'purple',
              'pink',
              'white',
              'gray',
              'black',
            ])
          )
          .default([]),
        type: z.array(z.string()).nullable().optional(),
      })
      .default({
        color: [],
        type: [],
      }),
    lower: z
      .object({
        color: z
          .array(
            z.enum([
              'brown',
              'red',
              'orange',
              'yellow',
              'green',
              'cyan',
              'blue',
              'purple',
              'pink',
              'white',
              'gray',
              'black',
            ])
          )
          .default([]),
        type: z.array(z.string()).nullable().optional(),
      })
      .default({
        color: [],
        type: [],
      }),
    other: z.record(z.boolean()).default({}),
    confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
});

// Union des schémas pour la validation
export const forensicSchema = z.discriminatedUnion('type', [
  vehicleForensicSchema,
  personForensicSchema,
]);

// Types inférés à partir des schémas
export type VehicleForensicFormValues = z.infer<typeof vehicleForensicSchema>;
export type PersonForensicFormValues = z.infer<typeof personForensicSchema>;
export type ForensicFormValues = z.infer<typeof forensicSchema>;
