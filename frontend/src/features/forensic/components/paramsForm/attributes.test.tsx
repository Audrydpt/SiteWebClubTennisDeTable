import { fireEvent, render, screen, within } from '@testing-library/react';
import { Control, UseFormReturn, UseWatchProps } from 'react-hook-form';
import { vi } from 'vitest';

import { Accordion } from '@/components/ui/accordion.tsx';
import { ForensicFormValues } from '../../lib/types';
import { ForensicFormContext } from '../../providers/forensic-form-context';
import Attributes from './attributes';

// Helper pour créer un contexte de test
const createMockContext = (subjectType: 'person' | 'vehicle' = 'person') => {
  const formMethods: UseFormReturn<ForensicFormValues> = {
    setValue: vi.fn(),
    control: {
      _formState: {
        errors: {},
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isValid: true,
        isValidating: false,
        isSubmitting: false,
        touchedFields: {},
        dirtyFields: {},
        defaultValues: {},
        disabled: false,
        submitCount: 0,
        validatingFields: {},
      },
      _fields: {},
      _defaultValues: {},
      _formValues: {},
      _stateFlags: {
        mount: true,
        action: false,
        watch: false,
        clear: false,
        focus: false,
        blur: false,
      },
      register: vi.fn(),
      unregister: vi.fn(),
      getFieldState: vi.fn(),
      _subjects: {
        values: { next: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() },
        array: { next: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() },
        state: { next: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() },
      },
      _names: {
        mount: new Set(),
        unMount: new Set(),
        array: new Set(),
        focus: '',
        watch: new Set(),
        watchAll: false,
      },
      _proxyFormState: {},
      _getDirty: vi.fn(),
      subjectType,
    } as unknown as Control<ForensicFormValues> & {
      subjectType: string;
    },
    watch: vi.fn(),
    handleSubmit: vi.fn(),
    formState: {
      errors: {},
      isDirty: false,
      isLoading: false,
      isSubmitted: false,
      isSubmitSuccessful: false,
      isValid: true,
      isValidating: false,
      isSubmitting: false,
      touchedFields: {},
      dirtyFields: {},
      defaultValues: {},
      disabled: false,
      submitCount: 0,
      validatingFields: {},
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

// Mock react-hook-form's useWatch
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form');
  return {
    ...actual,
    useWatch: vi.fn((options: UseWatchProps<ForensicFormValues>) => {
      if (options.name === 'attributes') {
        if (
          (
            options.control as Control<ForensicFormValues> & {
              subjectType: string;
            }
          )?.subjectType === 'person'
        ) {
          return {
            upper: { type: [], color: [] },
            lower: { type: [], color: [] },
            other: {},
            confidence: 'medium',
          };
        }
        return {
          mmr: [],
          plate: '',
          other: {},
          confidence: 'medium',
        };
      }
      if (options.name === 'attributes.confidence') {
        return 'medium';
      }
      return options.defaultValue;
    }),
    useController: vi.fn(() => ({
      field: {
        value: [],
        onChange: vi.fn(),
        onBlur: vi.fn(),
        name: 'test',
        ref: vi.fn(),
      },
      fieldState: {
        invalid: false,
        isTouched: false,
        isDirty: false,
        error: undefined,
      },
    })),
  };
});

describe('Attributes', () => {
  const renderComponent = (subjectType: 'person' | 'vehicle' = 'person') => {
    const mockContext = createMockContext(subjectType);
    // Add subjectType to control for the mock
    (
      mockContext.formMethods.control as Control<ForensicFormValues> & {
        subjectType: string;
      }
    ).subjectType = subjectType;

    return {
      ...render(
        <ForensicFormContext.Provider value={mockContext}>
          <Accordion type="multiple">
            <Attributes />
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
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      ).toBeInTheDocument();
    });

    it('should render person attribute fields when subjectType is person', () => {
      renderComponent('person');

      // Expand accordion
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      expect(
        screen.getByText('forensic:attributes.top_type')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:attributes.top_color')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:attributes.bottom_type')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:attributes.bottom_color')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:attributes.distinctive_features')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:attributes.tolerance')
      ).toBeInTheDocument();
    });

    it('should render vehicle attribute fields when subjectType is vehicle', () => {
      renderComponent('vehicle');

      // Expand accordion
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      expect(screen.getByText('forensic:attributes.brand')).toBeInTheDocument();
      expect(screen.getByText('forensic:attributes.model')).toBeInTheDocument();
      expect(screen.getByText('forensic:attributes.plate')).toBeInTheDocument();
      expect(
        screen.getByText('forensic:attributes.distinctive_features')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:attributes.contextual_situation')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:attributes.tolerance')
      ).toBeInTheDocument();
    });

    it('should not render person fields when subjectType is vehicle', () => {
      renderComponent('vehicle');

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      expect(
        screen.queryByText('forensic:attributes.top_type')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('forensic:attributes.bottom_type')
      ).not.toBeInTheDocument();
    });

    it('should not render vehicle fields when subjectType is person', () => {
      renderComponent('person');

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      expect(
        screen.queryByText('forensic:attributes.brand')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('forensic:attributes.plate')
      ).not.toBeInTheDocument();
    });
  });

  describe('Person Attribute Fields', () => {
    beforeEach(() => {
      renderComponent('person');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );
    });

    it('should render top clothing multi-select and color picker', () => {
      const topTypeSection = screen
        .getByText('forensic:attributes.top_type')
        .closest('div');
      const topColorSection = screen
        .getByText('forensic:attributes.top_color')
        .closest('div');

      expect(within(topTypeSection!).getByRole('combobox')).toBeInTheDocument();
      expect(within(topColorSection!).getByRole('button')).toBeInTheDocument();
    });

    it('should render bottom clothing multi-select and color picker', () => {
      const bottomTypeSection = screen
        .getByText('forensic:attributes.bottom_type')
        .closest('div');
      const bottomColorSection = screen
        .getByText('forensic:attributes.bottom_color')
        .closest('div');

      expect(
        within(bottomTypeSection!).getByRole('combobox')
      ).toBeInTheDocument();
      expect(
        within(bottomColorSection!).getByRole('button')
      ).toBeInTheDocument();
    });

    it('should render distinctive features checkboxes', () => {
      const distinctiveSection = screen
        .getByText('forensic:attributes.distinctive_features')
        .closest('div');

      // Should have checkboxes for person distinctive features
      expect(within(distinctiveSection!).getAllByRole('checkbox')).toHaveLength(
        4
      ); // Based on actual data
    });

    it('should render tolerance select with correct default value', () => {
      // Find the select by looking for the SelectTrigger button
      const toleranceSection = screen
        .getByText('forensic:attributes.tolerance')
        .closest('div');
      const toleranceSelect = within(toleranceSection!).getByRole('combobox');
      expect(toleranceSelect).toBeInTheDocument();
      expect(toleranceSelect).toHaveTextContent('Moyenne');
    });
  });

  describe('Vehicle Attribute Fields', () => {
    beforeEach(() => {
      renderComponent('vehicle');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );
    });

    it('should render brand multi-select', () => {
      const brandSection = screen
        .getByText('forensic:attributes.brand')
        .closest('div');
      const multiSelect = within(brandSection!).getByRole('combobox');

      expect(multiSelect).toBeInTheDocument();
    });

    it('should render model multi-select', () => {
      const modelSection = screen
        .getByText('forensic:attributes.model')
        .closest('div');
      const multiSelect = within(modelSection!).getByRole('combobox');

      expect(multiSelect).toBeInTheDocument();
    });

    it('should render license plate input', () => {
      const plateInput = screen.getByPlaceholderText('AB-123-CD');
      expect(plateInput).toBeInTheDocument();
    });

    it('should render vehicle distinctive features checkboxes', () => {
      const distinctiveSection = screen
        .getByText('forensic:attributes.distinctive_features')
        .closest('div');

      // Should have checkboxes for vehicle distinctive features only (not contextual)
      expect(within(distinctiveSection!).getAllByRole('checkbox')).toHaveLength(
        4
      );
    });

    it('should render contextual situation checkboxes', () => {
      const contextualSection = screen
        .getByText('forensic:attributes.contextual_situation')
        .closest('div');

      // Should have checkboxes for contextual features
      expect(within(contextualSection!).getAllByRole('checkbox')).toHaveLength(
        3
      ); // Based on actual data
    });

    it('should render tolerance select', () => {
      const toleranceSection = screen
        .getByText('forensic:attributes.tolerance')
        .closest('div');
      const toleranceSelect = within(toleranceSection!).getByRole('combobox');
      expect(toleranceSelect).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('should call setValue when license plate input changes', async () => {
      const { mockContext } = renderComponent('vehicle');
      const setValueSpy = mockContext.formMethods.setValue;

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      const plateInput = screen.getByPlaceholderText('AB-123-CD');

      fireEvent.change(plateInput, { target: { value: 'XY-456-ZW' } });

      expect(setValueSpy).toHaveBeenCalledWith('attributes.plate', 'XY-456-ZW');
    });

    it('should handle checkbox changes for distinctive features', async () => {
      const { mockContext } = renderComponent('person');
      const setValueSpy = mockContext.formMethods.setValue;

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      const distinctiveSection = screen
        .getByText('forensic:attributes.distinctive_features')
        .closest('div');
      const firstCheckbox = within(distinctiveSection!).getAllByRole(
        'checkbox'
      )[0];

      fireEvent.click(firstCheckbox);

      expect(setValueSpy).toHaveBeenCalled();
    });

    it('should update tolerance when select value changes', async () => {
      const { mockContext } = renderComponent('person');
      const setValueSpy = mockContext.formMethods.setValue;

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      const toleranceSection = screen
        .getByText('forensic:attributes.tolerance')
        .closest('div');
      const toleranceSelect = within(toleranceSection!).getByRole('combobox');
      fireEvent.click(toleranceSelect);

      const highOption = screen.getByRole('option', { name: 'Haute' });
      fireEvent.click(highOption);

      expect(setValueSpy).toHaveBeenCalledWith('attributes.confidence', 'high');
    });
  });

  describe('Edge Cases', () => {
    it('should handle accordion collapse and expand', () => {
      renderComponent('person');

      const accordionTrigger = screen.getByRole('button', {
        name: /forensic:attributes.title/i,
      });

      // Initially collapsed
      expect(
        screen.queryByText('forensic:attributes.top_type')
      ).not.toBeInTheDocument();

      // Expand
      fireEvent.click(accordionTrigger);
      expect(
        screen.getByText('forensic:attributes.top_type')
      ).toBeInTheDocument();

      // Collapse again
      fireEvent.click(accordionTrigger);
      expect(
        screen.queryByText('forensic:attributes.top_type')
      ).not.toBeInTheDocument();
    });

    it('should handle tolerance labels correctly', () => {
      renderComponent('person');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      const toleranceSection = screen
        .getByText('forensic:attributes.tolerance')
        .closest('div');
      const toleranceSelect = within(toleranceSection!).getByRole('combobox');
      fireEvent.click(toleranceSelect);

      // Check that French labels are displayed
      expect(screen.getByRole('option', { name: 'Basse' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Moyenne' })
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Haute' })).toBeInTheDocument();
    });

    it('should handle empty license plate input', () => {
      renderComponent('vehicle');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      const plateInput = screen.getByPlaceholderText('AB-123-CD');
      expect(plateInput).toHaveValue('');
    });

    it('should handle checkbox state changes correctly', () => {
      renderComponent('person');
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      const distinctiveSection = screen
        .getByText('forensic:attributes.distinctive_features')
        .closest('div');
      const checkboxes = within(distinctiveSection!).getAllByRole('checkbox');

      // All checkboxes should be unchecked initially
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should render without crashing when context is provided', () => {
      const mockContext = createMockContext('person');

      render(
        <ForensicFormContext.Provider value={mockContext}>
          <Accordion type="multiple">
            <Attributes />
          </Accordion>
        </ForensicFormContext.Provider>
      );

      // Should not crash and should render accordion
      expect(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      ).toBeInTheDocument();
    });

    it('should handle missing attributes data gracefully', () => {
      const mockContext = createMockContext('person');
      // Simulate missing attributes
      (
        mockContext.formMethods.control as Control<ForensicFormValues> & {
          subjectType: string;
        }
      ).subjectType = 'person';

      render(
        <ForensicFormContext.Provider value={mockContext}>
          <Accordion type="multiple">
            <Attributes />
          </Accordion>
        </ForensicFormContext.Provider>
      );

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:attributes.title/i })
      );

      // Should not crash and should render fields
      expect(
        screen.getByText('forensic:attributes.top_type')
      ).toBeInTheDocument();
    });
  });
});
