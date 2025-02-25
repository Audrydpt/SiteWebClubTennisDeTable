import { AcicEvent } from './props';

export type Filter = {
  column: string;
  value: string;
};

export interface StepperFormData {
  // Source: origin of the data
  table: AcicEvent;
  range?: {
    from?: Date;
    to?: Date;
  };

  // Options: selection of export options
  groupBy?: string;
  where?: Filter[];

  // Format: export format
  format?: 'PDF' | 'Excel';
}
export interface ExportStep {
  storedWidget: StepperFormData;
  updateStoredWidget: (newData: Partial<StepperFormData>) => void;
  setStepValidity: (valid: boolean) => void;
}
