import { JSX } from 'react';
import { AcicAggregation, AcicEvent } from './props';

export type Filter = {
  column: string;
  value: string;
};

export interface StepperFormData {
  // Source: origin of the data
  table: AcicEvent;
  duration?: AcicAggregation;
  range?: {
    from?: Date;
    to?: Date;
  };
  stream?: string;

  // Options: selection of export options
  aggregation?: AcicAggregation;
  groupBy?: string;
  where?: Filter[];

  // Format: export format
  format?: 'PDF' | 'Excel' | 'JPEG';
}
export interface ExportStep {
  storedWidget: StepperFormData;
  chartContent?: JSX.Element;
  getChartRef?: () => HTMLDivElement | undefined;
  updateStoredWidget: (newData: Partial<StepperFormData>) => void;
  setStepValidity: (valid: boolean) => void;
  children?: React.ReactNode;
}
