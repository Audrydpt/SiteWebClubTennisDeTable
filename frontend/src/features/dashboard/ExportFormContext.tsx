import React, { createContext, useContext, useMemo, useState } from 'react';
import { AcicEvent } from './lib/props';

type FormContextType = {
  formData: {
    source: {
      startDate: string;
      endDate: string;
      table: AcicEvent;
      streams: number[];
    };
    options: {
      groupBy: string;
      aggregation: string;
      where: never[];
    };
    format: 'Excel' | 'PDF';
  };
  updateFields: (fields: Partial<FormContextType['formData']>) => void;
};

const ExportFormContext = createContext<FormContextType | null>(null);

export const useFormContext = () => useContext(ExportFormContext);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState({
    source: {
      startDate: '',
      endDate: '',
      table: {} as AcicEvent,
      streams: [] as number[],
    },
    options: {
      groupBy: '',
      aggregation: '',
      where: [],
    },
    format: '' as 'Excel' | 'PDF',
  });

  const updateFields = (fields: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const value = useMemo(() => ({ formData, updateFields }), [formData]);

  return (
    <ExportFormContext.Provider value={value}>
      {children}
    </ExportFormContext.Provider>
  );
}
