import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { ForensicFormValues, forensicSchema } from '../types';
import { ForensicFormContext, getDefaultValues } from './forensic-form-context';

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

  // Fonction pour changer le type et préserver sources et timerange
  const setSubjectType = useCallback(
    (type: 'vehicle' | 'person') => {
      // Récupérer les valeurs actuelles
      const currentValues = formMethods.getValues();

      // Préserver les sources et plage temporelle
      const preservedValues = {
        sources: currentValues.sources || [],
        timerange: currentValues.timerange || {
          time_from: '',
          time_to: '',
        },
        context: currentValues.context || {},
      };

      // Générer les nouvelles valeurs par défaut selon le type
      const defaultValues = getDefaultValues(type);

      // Fusionner les valeurs par défaut avec les valeurs préservées
      const newValues = {
        ...defaultValues,
        sources: preservedValues.sources,
        timerange: preservedValues.timerange,
        context: preservedValues.context,
      };

      // Mettre à jour le type et réinitialiser le formulaire avec les valeurs fusionnées
      formMethods.reset(newValues);
    },
    [formMethods]
  );

  // Surveiller les changements dans le champ "type"
  useEffect(() => {
    const subscription = formMethods.watch((value, { name }) => {
      if (name === 'type' && value.type !== subjectType) {
        setSubjectType(value.type as 'vehicle' | 'person');
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethods, setSubjectType, subjectType]);

  // Mémoiser la valeur du contexte pour éviter les re-rendus inutiles
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
