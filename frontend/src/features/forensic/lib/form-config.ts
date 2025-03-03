import formConfigData from './form-config.json';

export interface Color {
  name: string;
  value: string;
}

export interface CheckboxItem {
  id: string;
  label: string;
}

export interface FormConfig {
  genderOptions: string[];
  ageOptions: string[];
  buildOptions: string[];
  heightOptions: string[];
  hairLengthOptions: string[];
  hairStyleOptions: string[];
  topTypeOptions: string[];
  bottomTypeOptions: string[];
  sizeOptions: string[];
  toleranceOptions: string[];
  vehicleTypes: string[];
  distinctiveItems: {
    person: CheckboxItem[];
    vehicle: CheckboxItem[];
  };
  contextualItems: {
    person: CheckboxItem[];
    vehicle: CheckboxItem[];
  };
  colors: Color[];
}

// Type assertion to ensure the JSON has the correct structure
export const formConfig = formConfigData as FormConfig;

// Export individual options for convenience
export const {
  genderOptions,
  ageOptions,
  buildOptions,
  heightOptions,
  hairLengthOptions,
  hairStyleOptions,
  topTypeOptions,
  bottomTypeOptions,
  sizeOptions,
  toleranceOptions,
  vehicleTypes,
  distinctiveItems,
  contextualItems,
  colors,
} = formConfig;
