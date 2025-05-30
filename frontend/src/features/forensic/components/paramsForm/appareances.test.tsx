import { fireEvent, render, screen, within } from '@testing-library/react';
import { Control, UseFormReturn, UseWatchProps } from 'react-hook-form';
import { vi } from 'vitest';

import { Accordion } from '@/components/ui/accordion.tsx';
import { ForensicFormValues } from '../../lib/types';
import { ForensicFormContext } from '../../providers/forensic-form-context';
import Appearances from './appareances';

// Helper pour créer un contexte de test
const createMockContext = (subjectType: 'person' | 'vehicle' = 'person') => {
  const mockControl = {
    _subjects: {
      array: new Map(),
      values: new Map(),
    },
    _names: {},
    _formValues: {},
    _defaultValues: {},
    _formState: {
      errors: {},
      isDirty: false,
      isLoading: false,
      isSubmitted: false,
      isSubmitSuccessful: false,
      isSubmitting: false,
      isValidating: false,
      isValid: true,
      submitCount: 0,
      dirtyFields: {},
      touchedFields: {},
      validatingFields: {},
      defaultValues: {},
      disabled: false,
    },
    register: vi.fn(),
    unregister: vi.fn(),
    getFieldState: vi.fn(),
    trigger: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
    watch: vi.fn(),
    handleSubmit: vi.fn(),
    reset: vi.fn(),
    clearErrors: vi.fn(),
    setError: vi.fn(),
  } as unknown as Control<ForensicFormValues>;

  const formMethods: UseFormReturn<ForensicFormValues> = {
    setValue: vi.fn(),
    control: mockControl,
    watch: vi.fn(),
    handleSubmit: vi.fn(),
    formState: {
      errors: {},
      isDirty: false,
      isLoading: false,
      isSubmitted: false,
      isSubmitSuccessful: false,
      isSubmitting: false,
      isValidating: false,
      isValid: true,
      submitCount: 0,
      dirtyFields: {},
      touchedFields: {},
      validatingFields: {},
      defaultValues: {},
      disabled: false,
    },
    register: vi.fn(),
    getValues: vi.fn(),
    trigger: vi.fn(),
    reset: vi.fn(),
    clearErrors: vi.fn(),
    setError: vi.fn(),
    getFieldState: vi.fn(),
    resetField: vi.fn(),
    setFocus: vi.fn(),
    unregister: vi.fn(),
  };

  return {
    formMethods,
    subjectType,
    setSubjectType: vi.fn(),
  };
};

// Mock react-hook-form's useWatch and useController
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form');
  return {
    ...actual,
    useWatch: vi.fn((options: UseWatchProps<ForensicFormValues>) => {
      if (options.name === 'appearances') {
        return (
          options.defaultValue || {
            gender: [],
            seenAge: [],
            build: [],
            height: [],
            hair: {
              length: [],
              style: [],
              color: [],
            },
            confidence: 'medium',
          }
        );
      }
      if (options.name === 'appearances.confidence') {
        return 'medium';
      }
      return options.defaultValue;
    }),
    useController: vi.fn((options) => ({
      field: {
        value: options.defaultValue || [],
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
        name: options.name,
      },
      fieldState: {
        error: undefined,
        isDirty: false,
        isTouched: false,
        invalid: false,
      },
      formState: {
        errors: {},
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        submitCount: 0,
      },
    })),
  };
});

describe('Appearances', () => {
  const renderComponent = (subjectType: 'person' | 'vehicle' = 'person') => {
    const mockContext = createMockContext(subjectType);

    return {
      ...render(
        <ForensicFormContext.Provider value={mockContext}>
          <Accordion type="multiple">
            <Appearances />
          </Accordion>
        </ForensicFormContext.Provider>
      ),
      mockContext,
    };
  };

  describe('Basic Rendering', () => {
    it('should render accordion item with correct title', () => {
      renderComponent();

      expect(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      ).toBeInTheDocument();
    });

    it('should render person appearance fields when subjectType is person', () => {
      renderComponent('person');

      // Expand accordion
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      expect(
        screen.getByText('forensic:appearances.gender')
      ).toBeInTheDocument();
      expect(screen.getByText('forensic:appearances.age')).toBeInTheDocument();
      expect(
        screen.getByText('forensic:appearances.build')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:appearances.height')
      ).toBeInTheDocument();
      expect(screen.getByText('forensic:appearances.hair')).toBeInTheDocument();
      expect(
        screen.getByText('forensic:appearances.tolerance')
      ).toBeInTheDocument();
    });

    it('should render vehicle appearance fields when subjectType is vehicle', () => {
      renderComponent('vehicle');

      // Expand accordion
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      expect(
        screen.getByText('forensic:appearances.vehicle_type')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:appearances.vehicle_color')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:appearances.tolerance')
      ).toBeInTheDocument();
    });

    it('should not render person fields when subjectType is vehicle', () => {
      renderComponent('vehicle');

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      expect(
        screen.queryByText('forensic:appearances.gender')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('forensic:appearances.age')
      ).not.toBeInTheDocument();
    });

    it('should not render vehicle fields when subjectType is person', () => {
      renderComponent('person');

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      expect(
        screen.queryByText('forensic:appearances.vehicle_type')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('forensic:appearances.vehicle_color')
      ).not.toBeInTheDocument();
    });
  });

  describe('Person Appearance Fields', () => {
    beforeEach(() => {
      renderComponent('person');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );
    });

    it('should render gender multi-select with correct options', () => {
      const genderSection = screen
        .getByText('forensic:appearances.gender')
        .closest('div');
      const multiSelectButton = within(genderSection!).getByRole('combobox');

      expect(multiSelectButton).toBeInTheDocument();
      expect(multiSelectButton).toHaveTextContent('Sélectionner...');
    });

    it('should render age multi-select', () => {
      const ageSection = screen
        .getByText('forensic:appearances.age')
        .closest('div');
      const multiSelectButton = within(ageSection!).getByRole('combobox');

      expect(multiSelectButton).toBeInTheDocument();
    });

    it('should render build multi-select', () => {
      const buildSection = screen
        .getByText('forensic:appearances.build')
        .closest('div');
      const multiSelectButton = within(buildSection!).getByRole('combobox');

      expect(multiSelectButton).toBeInTheDocument();
    });

    it('should render height multi-select', () => {
      const heightSection = screen
        .getByText('forensic:appearances.height')
        .closest('div');
      const multiSelectButton = within(heightSection!).getByRole('combobox');

      expect(multiSelectButton).toBeInTheDocument();
    });

    it('should render hair section with length, style, and color fields', () => {
      expect(screen.getByText('forensic:appearances.hair')).toBeInTheDocument();
      expect(
        screen.getByText('forensic:appearances.hair_length')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:appearances.hair_style')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:appearances.hair_color')
      ).toBeInTheDocument();

      // ColorPicker should be present (will need to check actual implementation)
      const hairColorSection = screen
        .getByText('forensic:appearances.hair_color')
        .closest('div');
      expect(hairColorSection).toBeInTheDocument();
    });

    it('should render tolerance select with correct default value', () => {
      // The tolerance select shows "Moyenne" as default
      expect(screen.getByText('Moyenne')).toBeInTheDocument();
    });
  });

  describe('Vehicle Appearance Fields', () => {
    beforeEach(() => {
      renderComponent('vehicle');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );
    });

    it('should render vehicle type multi-select', () => {
      const typeSection = screen
        .getByText('forensic:appearances.vehicle_type')
        .closest('div');
      const multiSelectButton = within(typeSection!).getByRole('combobox');

      expect(multiSelectButton).toBeInTheDocument();
    });

    it('should render vehicle color picker', () => {
      const colorSection = screen
        .getByText('forensic:appearances.vehicle_color')
        .closest('div');

      expect(colorSection).toBeInTheDocument();
    });

    it('should render tolerance select', () => {
      // The tolerance select shows "Moyenne" as default
      expect(screen.getByText('Moyenne')).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('should call setValue when gender selection changes', async () => {
      const { mockContext } = renderComponent('person');
      const setValueSpy = mockContext.formMethods.setValue;

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      const genderSection = screen
        .getByText('forensic:appearances.gender')
        .closest('div');
      const genderButton = within(genderSection!).getByRole('combobox');

      // Open the popover
      fireEvent.click(genderButton);

      // Find and click the exact male option
      const maleOption = screen.getByRole('option', { name: 'male' });
      fireEvent.click(maleOption);

      expect(setValueSpy).toHaveBeenCalledWith(
        'appearances.gender',
        expect.arrayContaining(['male'])
      );
    });

    it('should update tolerance when select value changes', async () => {
      const { mockContext } = renderComponent('person');
      const setValueSpy = mockContext.formMethods.setValue;

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      // Find the tolerance select by its text content
      const toleranceSelect = screen.getByText('Moyenne');
      fireEvent.click(toleranceSelect);

      // Find and click the "high" option
      const highOption = screen.getByRole('option', { name: 'Haute' });
      fireEvent.click(highOption);

      expect(setValueSpy).toHaveBeenCalledWith(
        'appearances.confidence',
        'high'
      );
    });

    it('should handle multi-selection for person attributes', async () => {
      const { mockContext } = renderComponent('person');
      const setValueSpy = mockContext.formMethods.setValue;

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      const buildSection = screen
        .getByText('forensic:appearances.build')
        .closest('div');
      const buildButton = within(buildSection!).getByRole('combobox');

      // Open the popover
      fireEvent.click(buildButton);

      // Find and click the slim option
      const slimOption = screen.getByRole('option', { name: 'slim' });
      fireEvent.click(slimOption);

      expect(setValueSpy).toHaveBeenCalledWith(
        'appearances.build',
        expect.arrayContaining(['slim'])
      );
    });

    it('should handle vehicle type selection', async () => {
      const { mockContext } = renderComponent('vehicle');
      const setValueSpy = mockContext.formMethods.setValue;

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      const typeSection = screen
        .getByText('forensic:appearances.vehicle_type')
        .closest('div');
      const typeButton = within(typeSection!).getByRole('combobox');

      // Open the popover
      fireEvent.click(typeButton);

      // Find and click the exact car option (not caravan)
      const carOption = screen.getByRole('option', { name: 'car' });
      fireEvent.click(carOption);

      expect(setValueSpy).toHaveBeenCalledWith(
        'appearances.type',
        expect.arrayContaining(['car'])
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays for selected values', () => {
      renderComponent('person');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      // Multi-selects should show placeholder when no items are selected
      const genderSection = screen
        .getByText('forensic:appearances.gender')
        .closest('div');
      const genderButton = within(genderSection!).getByRole('combobox');
      expect(genderButton).toHaveTextContent('Sélectionner...');
    });

    it('should handle accordion collapse and expand', () => {
      renderComponent('person');

      const accordionTrigger = screen.getByRole('button', {
        name: /forensic:appearances.title/i,
      });

      // Initially collapsed
      expect(
        screen.queryByText('forensic:appearances.gender')
      ).not.toBeInTheDocument();

      // Expand
      fireEvent.click(accordionTrigger);
      expect(
        screen.getByText('forensic:appearances.gender')
      ).toBeInTheDocument();

      // Collapse again
      fireEvent.click(accordionTrigger);
      expect(
        screen.queryByText('forensic:appearances.gender')
      ).not.toBeInTheDocument();
    });

    it('should handle tolerance labels correctly', () => {
      renderComponent('person');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      // Find the tolerance select by its text content
      const toleranceSelect = screen.getByText('Moyenne');
      fireEvent.click(toleranceSelect);

      // Check that French labels are displayed
      expect(screen.getByRole('option', { name: 'Basse' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Moyenne' })
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Haute' })).toBeInTheDocument();
    });

    it('should maintain scroll area height constraint', () => {
      renderComponent('person');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      );

      // Check for the scroll area element with the inline style
      const scrollAreaElement = document.querySelector(
        '[style*="max-height: 400px"]'
      );
      expect(scrollAreaElement).toBeInTheDocument();
    });

    it('should render without crashing when context is provided', () => {
      const mockContext = createMockContext('person');

      render(
        <ForensicFormContext.Provider value={mockContext}>
          <Accordion type="multiple">
            <Appearances />
          </Accordion>
        </ForensicFormContext.Provider>
      );

      // Should not crash and should render accordion
      expect(
        screen.getByRole('button', { name: /forensic:appearances.title/i })
      ).toBeInTheDocument();
    });
  });
});
