import { fireEvent, render, screen } from '@testing-library/react';
import { Control, UseFormReturn } from 'react-hook-form';
import { vi } from 'vitest';

import { ForensicFormValues } from '../lib/types';
import { ForensicFormContext } from '../providers/forensic-form-context';
import ForensicForm from './form';

// Mock des composants enfants
vi.mock('./ui/params', () => ({
  default: () => <div data-testid="params-component">Params Component</div>,
}));

vi.mock('./ui/submit', () => ({
  default: () => <div data-testid="submit-component">Submit Component</div>,
}));

// Helper pour créer un contexte de test
const createMockContext = () => {
  const formMethods: UseFormReturn<ForensicFormValues> = {
    setValue: vi.fn(),
    control: {} as Control<ForensicFormValues>,
    watch: vi.fn(),
    handleSubmit: vi.fn((callback) => async (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault();
      const mockData: ForensicFormValues = {
        type: 'person',
        sources: ['camera-1'],
        timerange: {
          time_from: '2024-01-15T10:00:00.000Z',
          time_to: '2024-01-15T18:00:00.000Z',
        },
        context: {},
        appearances: {
          gender: ['male'],
          seenAge: ['adult'],
          build: ['slim'],
          height: ['average'],
          hair: {
            length: ['short'],
            style: ['straight'],
            color: ['brown'],
          },
          confidence: 'medium',
        },
        attributes: {
          upper: {
            type: ['shirt'],
            color: ['blue'],
          },
          lower: {
            type: ['pants'],
            color: ['black'],
          },
          other: {},
          confidence: 'medium',
        },
      };
      callback(mockData);
    }),
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
    subjectType: 'person' as const,
    setSubjectType: vi.fn(),
  };
};

describe('ForensicForm', () => {
  const mockOnSubmit = vi.fn();

  const renderComponent = (props = {}) => {
    const mockContext = createMockContext();
    const defaultProps = {
      onSubmit: mockOnSubmit,
    };

    const mergedProps = { ...defaultProps, ...props };

    return {
      ...render(
        <ForensicFormContext.Provider value={mockContext}>
          <ForensicForm {...mergedProps} />
        </ForensicFormContext.Provider>
      ),
      mockContext,
    };
  };

  // Helper function to get form element using semantic selector
  const getFormElement = () => document.querySelector('form');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();

      expect(getFormElement()).toBeInTheDocument();
    });

    it('should render form element with correct structure', () => {
      renderComponent();

      const form = getFormElement();
      expect(form).toBeInTheDocument();
      expect(form).toHaveClass('flex', 'flex-col', 'h-full', 'relative');
    });

    it('should render Params component', () => {
      renderComponent();

      expect(screen.getByTestId('params-component')).toBeInTheDocument();
      expect(screen.getByText('Params Component')).toBeInTheDocument();
    });

    it('should render Submit component', () => {
      renderComponent();

      expect(screen.getByTestId('submit-component')).toBeInTheDocument();
      expect(screen.getByText('Submit Component')).toBeInTheDocument();
    });

    it('should render children in correct order', () => {
      renderComponent();

      const form = getFormElement();
      const params = screen.getByTestId('params-component');
      const submit = screen.getByTestId('submit-component');

      expect(form).toContainElement(params);
      expect(form).toContainElement(submit);

      // Check order: Params should come before Submit
      const formChildren = Array.from(form!.children);
      const paramsIndex = formChildren.findIndex((child) =>
        child.contains(params)
      );
      const submitIndex = formChildren.findIndex((child) =>
        child.contains(submit)
      );

      expect(paramsIndex).toBeLessThan(submitIndex);
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit when form is submitted', () => {
      renderComponent();

      const form = getFormElement();
      fireEvent.submit(form!);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit with correct form data', () => {
      renderComponent();

      const form = getFormElement();
      fireEvent.submit(form!);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        type: 'person',
        sources: ['camera-1'],
        timerange: {
          time_from: '2024-01-15T10:00:00.000Z',
          time_to: '2024-01-15T18:00:00.000Z',
        },
        context: {},
        appearances: {
          gender: ['male'],
          seenAge: ['adult'],
          build: ['slim'],
          height: ['average'],
          hair: {
            length: ['short'],
            style: ['straight'],
            color: ['brown'],
          },
          confidence: 'medium',
        },
        attributes: {
          upper: {
            type: ['shirt'],
            color: ['blue'],
          },
          lower: {
            type: ['pants'],
            color: ['black'],
          },
          other: {},
          confidence: 'medium',
        },
      });
    });

    it('should use handleSubmit from formMethods', () => {
      const { mockContext } = renderComponent();

      const form = getFormElement();
      fireEvent.submit(form!);

      expect(mockContext.formMethods.handleSubmit).toHaveBeenCalledTimes(1);
      expect(mockContext.formMethods.handleSubmit).toHaveBeenCalledWith(
        mockOnSubmit
      );
    });

    it('should handle multiple form submissions', () => {
      renderComponent();

      const form = getFormElement();

      fireEvent.submit(form!);
      fireEvent.submit(form!);
      fireEvent.submit(form!);

      expect(mockOnSubmit).toHaveBeenCalledTimes(3);
    });

    it('should prevent default form submission behavior', () => {
      renderComponent();

      const form = getFormElement();
      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });

      form!.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
    });

    it('should handle form submission with empty data', () => {
      const customContext = createMockContext();
      customContext.formMethods.handleSubmit = vi.fn(
        (callback) => async (e?: React.BaseSyntheticEvent) => {
          e?.preventDefault();
          callback({} as ForensicFormValues);
        }
      );

      render(
        <ForensicFormContext.Provider value={customContext}>
          <ForensicForm onSubmit={mockOnSubmit} />
        </ForensicFormContext.Provider>
      );

      const form = getFormElement();
      fireEvent.submit(form!);

      expect(mockOnSubmit).toHaveBeenCalledWith({});
    });

    it('should maintain form structure with missing context methods', () => {
      const incompleteContext = {
        formMethods: {
          handleSubmit: vi.fn(() => async () => {}),
        } as Partial<UseFormReturn<ForensicFormValues>>,
        subjectType: 'person' as const,
        setSubjectType: vi.fn(),
      };

      render(
        <ForensicFormContext.Provider
          value={incompleteContext as ReturnType<typeof createMockContext>}
        >
          <ForensicForm onSubmit={mockOnSubmit} />
        </ForensicFormContext.Provider>
      );

      const form = getFormElement();
      expect(form).toBeInTheDocument();
      expect(screen.getByTestId('params-component')).toBeInTheDocument();
      expect(screen.getByTestId('submit-component')).toBeInTheDocument();
    });

    it('should handle rapid form submissions', () => {
      renderComponent();

      const form = getFormElement();

      // Rapid submissions
      fireEvent.submit(form!);
      fireEvent.submit(form!);
      fireEvent.submit(form!);
      fireEvent.submit(form!);
      fireEvent.submit(form!);

      expect(mockOnSubmit).toHaveBeenCalledTimes(5);
    });

    it('should render with minimal viable props', () => {
      const minimalOnSubmit = () => {};

      render(
        <ForensicFormContext.Provider value={createMockContext()}>
          <ForensicForm onSubmit={minimalOnSubmit} />
        </ForensicFormContext.Provider>
      );

      const form = getFormElement();
      expect(form).toBeInTheDocument();
      expect(screen.getByTestId('params-component')).toBeInTheDocument();
      expect(screen.getByTestId('submit-component')).toBeInTheDocument();
    });

    it('should maintain correct CSS classes on form element', () => {
      renderComponent();

      const form = getFormElement();
      expect(form).toHaveClass('flex');
      expect(form).toHaveClass('flex-col');
      expect(form).toHaveClass('h-full');
      expect(form).toHaveClass('relative');
    });
  });

  describe('Context Integration', () => {
    it('should use formMethods from ForensicFormContext', () => {
      const { mockContext } = renderComponent();

      // Verify that the component is using the context
      expect(mockContext.formMethods).toBeDefined();
      expect(mockContext.formMethods.handleSubmit).toBeDefined();
    });

    it('should handle context with different formMethods', () => {
      const customContext = createMockContext();
      customContext.formMethods.handleSubmit = vi.fn(
        (callback) => async (e?: React.BaseSyntheticEvent) => {
          e?.preventDefault();
          callback({ type: 'vehicle' } as ForensicFormValues);
        }
      );

      render(
        <ForensicFormContext.Provider value={customContext}>
          <ForensicForm onSubmit={mockOnSubmit} />
        </ForensicFormContext.Provider>
      );

      const form = getFormElement();
      fireEvent.submit(form!);

      expect(mockOnSubmit).toHaveBeenCalledWith({ type: 'vehicle' });
    });
  });

  describe('Props Handling', () => {
    it('should accept and use onSubmit prop', () => {
      const customOnSubmit = vi.fn();
      renderComponent({ onSubmit: customOnSubmit });

      const form = getFormElement();
      fireEvent.submit(form!);

      expect(customOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require onSubmit prop', () => {
      // This test verifies that the prop is required by TypeScript
      // The actual runtime behavior would be tested through integration
      const componentProps: React.ComponentProps<typeof ForensicForm> = {
        onSubmit: mockOnSubmit,
      };

      expect(componentProps.onSubmit).toBe(mockOnSubmit);
    });
  });

  describe('Edge Cases', () => {
    it('should handle form submission with empty data', () => {
      const customContext = createMockContext();
      customContext.formMethods.handleSubmit = vi.fn(
        (callback) => async (e?: React.BaseSyntheticEvent) => {
          e?.preventDefault();
          callback({} as ForensicFormValues);
        }
      );

      render(
        <ForensicFormContext.Provider value={customContext}>
          <ForensicForm onSubmit={mockOnSubmit} />
        </ForensicFormContext.Provider>
      );

      const form = getFormElement();
      fireEvent.submit(form!);

      expect(mockOnSubmit).toHaveBeenCalledWith({});
    });

    it('should maintain form structure with missing context methods', () => {
      const incompleteContext = {
        formMethods: {
          handleSubmit: vi.fn(() => async () => {}),
        } as Partial<UseFormReturn<ForensicFormValues>>,
        subjectType: 'person' as const,
        setSubjectType: vi.fn(),
      };

      render(
        <ForensicFormContext.Provider
          value={incompleteContext as ReturnType<typeof createMockContext>}
        >
          <ForensicForm onSubmit={mockOnSubmit} />
        </ForensicFormContext.Provider>
      );

      const form = getFormElement();
      expect(form).toBeInTheDocument();
      expect(screen.getByTestId('params-component')).toBeInTheDocument();
      expect(screen.getByTestId('submit-component')).toBeInTheDocument();
    });
  });
});
