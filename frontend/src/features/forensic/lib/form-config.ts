import formConfigData from './form-config.json';

export interface Color {
  name: string;
  value: string;
  label: string;
}

export interface CheckboxItem {
  id: string;
  label: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormConfig {
  typeOptions: SelectOption[];
  genderOptions: SelectOption[];
  ageOptions: SelectOption[];
  buildOptions: SelectOption[];
  heightOptions: SelectOption[];
  hairLengthOptions: SelectOption[];
  hairStyleOptions: SelectOption[];
  topTypeOptions: SelectOption[];
  bottomTypeOptions: SelectOption[];
  sizeOptions: SelectOption[];
  toleranceOptions: SelectOption[];
  vehicleTypes: SelectOption[];
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
  typeOptions,
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
