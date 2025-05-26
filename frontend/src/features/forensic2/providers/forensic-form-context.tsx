import { createContext, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { ForensicFormValues } from '../lib/types';

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
export const ForensicFormContext = createContext<
  ForensicFormContextProps | undefined
>(undefined);

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
