import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';

import { Accordion } from '@/components/ui/accordion.tsx';
import { ForensicFormContext } from '../../providers/forensic-form-context';
import type { ForensicFormContextProps } from '../../providers/forensic-form-context';
import Times from './times';

// Mock react-hook-form completely to avoid complex setup
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form');
  return {
    ...actual,
    useWatch: vi.fn().mockReturnValue(undefined),
    FormProvider: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    useController: vi.fn().mockReturnValue({
      field: { value: undefined, onChange: vi.fn(), onBlur: vi.fn() },
      fieldState: { error: undefined },
      formState: { errors: {} },
    }),
    Controller: ({
      render: renderProp,
    }: {
      render: (props: {
        field: ControllerRenderProps<FieldValues, FieldPath<FieldValues>>;
        fieldState: { error?: { message?: string } };
        formState: { errors: Record<string, unknown> };
      }) => React.ReactNode;
    }) =>
      renderProp({
        field: {
          value: undefined,
          onChange: vi.fn(),
          onBlur: vi.fn(),
          name: 'test',
          ref: vi.fn(),
        },
        fieldState: { error: undefined },
        formState: { errors: {} },
      }),
  };
});

describe('Times Component', () => {
  const createBasicContext = () => ({
    formMethods: {
      setValue: vi.fn(),
      setError: vi.fn(),
      clearErrors: vi.fn(),
      control: {
        _subjects: { array: new Map(), values: new Map(), state: new Map() },
        _names: {
          array: new Set(),
          mount: new Set(),
          unMount: new Set(),
          watch: new Set(),
        },
        _formState: { errors: {}, isDirty: false, isSubmitSuccessful: false },
        _options: {},
        _formValues: {},
        _defaultValues: {},
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
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        defaultValues: {},
        disabled: false,
      },
    } as unknown as ForensicFormContextProps['formMethods'],
    subjectType: 'person' as const,
    setSubjectType: vi.fn(),
  });

  it('should render without crashing', () => {
    const context = createBasicContext();

    render(
      <ForensicFormContext.Provider value={context}>
        <Accordion type="multiple">
          <Times />
        </Accordion>
      </ForensicFormContext.Provider>
    );

    // Basic check that the component renders
    expect(
      screen.getByRole('button', { name: /forensic:times\.title/i })
    ).toBeInTheDocument();
  });

  it('should show error state in accordion trigger when there are form errors', () => {
    const context = createBasicContext();
    context.formMethods.formState.errors = {
      timerange: {
        type: 'manual',
        message: "L'heure de début doit être antérieure à l'heure de fin",
      },
    };

    render(
      <ForensicFormContext.Provider value={context}>
        <Accordion type="multiple">
          <Times />
        </Accordion>
      </ForensicFormContext.Provider>
    );

    const trigger = screen.getByRole('button', {
      name: /forensic:times\.title/i,
    });
    expect(trigger).toHaveClass('text-destructive');
  });

  it('should export a React component', () => {
    expect(Times).toBeDefined();
    expect(typeof Times).toBe('function');
  });
});
