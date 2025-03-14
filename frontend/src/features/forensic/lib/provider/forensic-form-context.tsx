/* eslint-disable */
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { z } from 'zod';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
        type: z
          .array(
            z.enum(['shirt', 'jacket', 'coat', 'sweater', 'dress', 'other'])
          )
          .default([]),
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
        type: z
          .array(z.enum(['pants', 'shorts', 'skirt', 'dress', 'other']))
          .default([]),
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

// Function to get default values based on type
export const getDefaultValues = (
  type: 'vehicle' | 'person'
): ForensicFormValues => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const baseValues = {
    sources: [] as string[], // Explicitly type as string[] to avoid never[]
    timerange: {
      time_from: oneDayAgo.toISOString(),
      time_to: now.toISOString(),
    },
    context: {},
  };

  if (type === 'vehicle') {
    return {
      ...baseValues,
      type: 'vehicle',
      appearances: {
        type: [],
        color: [],
        confidence: 'medium',
      },
      attributes: {
        mmr: [],
        plate: '',
        other: {},
        confidence: 'medium',
      },
    };
  }
  return {
    ...baseValues,
    type: 'person',
    appearances: {
      gender: [],
      seenAge: [],
      build: [],
      height: [],
      hair: {
        length: [],
        color: [],
        style: [],
      },
      confidence: 'medium',
    },
    attributes: {
      upper: {
        color: [],
        type: [],
      },
      lower: {
        color: [],
        type: [],
      },
      other: {},
      confidence: 'medium',
    },
  };
};

// Interface du contexte
interface ForensicFormContextProps {
  formMethods: UseFormReturn<ForensicFormValues>;
  subjectType: 'vehicle' | 'person';
  setSubjectType: (type: 'vehicle' | 'person') => void;
}

// Création du contexte
const ForensicFormContext = createContext<ForensicFormContextProps | undefined>(
  undefined
);

// Hook personnalisé pour accéder au contexte
export const useForensicForm = () => {
  const context = useContext(ForensicFormContext);
  if (context === undefined) {
    throw new Error(
      'useForensicForm must be used within a ForensicFormProvider'
    );
  }
  return context;
};

// Props du provider
interface ForensicFormProviderProps {
  children: ReactNode;
}

// Composant provider
export function ForensicFormProvider({ children }: ForensicFormProviderProps) {
  // Initialiser le formulaire avec le type par défaut (vehicle)
  const formMethods = useForm<ForensicFormValues>({
    resolver: zodResolver(forensicSchema),
    defaultValues: getDefaultValues('vehicle'),
  });

  // Obtenir le type actuel du formulaire
  const subjectType = formMethods.watch('type');

  // Fonction pour changer le type et réinitialiser le formulaire
  const setSubjectType = (type: 'vehicle' | 'person') => {
    formMethods.reset(getDefaultValues(type));
  };

  // Surveiller les changements dans le champ "type"
  useEffect(() => {
    const subscription = formMethods.watch((value, { name }) => {
      if (name === 'type') {
        setSubjectType(value.type as 'vehicle' | 'person');
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethods]);

  return (
    <ForensicFormContext.Provider
      value={{ formMethods, subjectType, setSubjectType }}
    >
      {children}
    </ForensicFormContext.Provider>
  );
}
