import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { ForensicFormValues, forensicSchema } from '../types';
import { ForensicFormContext } from './forensic-form-context';

// Function to get default values based on type
const getDefaultValues = (type: 'vehicle' | 'person'): ForensicFormValues => {
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

// Props du provider
interface ForensicFormProviderProps {
  children: ReactNode;
}

// Composant provider
export default function ForensicFormProvider({
  children,
}: ForensicFormProviderProps) {
  // Initialiser le formulaire avec le type par défaut (vehicle)
  const formMethods = useForm<ForensicFormValues>({
    resolver: zodResolver(forensicSchema),
    defaultValues: getDefaultValues('vehicle'),
  });

  // Obtenir le type actuel du formulaire
  const subjectType = formMethods.watch('type');

  // Fonction pour changer le type et réinitialiser le formulaire
  const setSubjectType = useCallback(
    (type: 'vehicle' | 'person') => {
      formMethods.reset(getDefaultValues(type));
    },
    [formMethods]
  );

  // Surveiller les changements dans le champ "type"
  useEffect(() => {
    const subscription = formMethods.watch((value, { name }) => {
      if (name === 'type') {
        setSubjectType(value.type as 'vehicle' | 'person');
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethods, setSubjectType]);

  // Memoize the context value to prevent unnecessary re-renders
  const memoizedValue = useMemo(
    () => ({ formMethods, subjectType, setSubjectType }),
    [formMethods, subjectType, setSubjectType]
  );

  return (
    <ForensicFormContext.Provider value={memoizedValue}>
      {children}
    </ForensicFormContext.Provider>
  );
}
