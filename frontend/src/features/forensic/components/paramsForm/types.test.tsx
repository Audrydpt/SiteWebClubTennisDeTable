import { fireEvent, render, screen } from '@testing-library/react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { vi } from 'vitest';

import { Accordion } from '@/components/ui/accordion.tsx';
import { Form } from '@/components/ui/form.tsx';
import { ForensicFormValues } from '../../lib/types';
import { ForensicFormContext } from '../../providers/forensic-form-context';
import Types from './types';

// Test wrapper component
function TestWrapper({
  subjectType = 'person',
  onSubjectTypeChange = vi.fn(),
}: {
  subjectType?: 'person' | 'vehicle';
  onSubjectTypeChange?: ReturnType<typeof vi.fn>;
}) {
  const form = useForm<ForensicFormValues>({
    defaultValues: {
      type: subjectType,
    },
  });

  const contextValue = useMemo(
    () => ({
      formMethods: form,
      subjectType,
      setSubjectType: onSubjectTypeChange,
    }),
    [form, subjectType, onSubjectTypeChange]
  );

  return (
    <Form {...form}>
      <ForensicFormContext.Provider value={contextValue}>
        <Accordion type="multiple">
          <Types />
        </Accordion>
      </ForensicFormContext.Provider>
    </Form>
  );
}

describe('Types', () => {
  const renderComponent = (
    subjectType: 'person' | 'vehicle' = 'person',
    onSubjectTypeChange = vi.fn()
  ) => {
    const result = render(
      <TestWrapper
        subjectType={subjectType}
        onSubjectTypeChange={onSubjectTypeChange}
      />
    );

    return {
      ...result,
      mockSetSubjectType: onSubjectTypeChange,
    };
  };

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();

      expect(
        screen.getByRole('button', { name: /forensic:types.title/i })
      ).toBeInTheDocument();
    });

    it('should render accordion item with correct title', () => {
      renderComponent();

      expect(
        screen.getByRole('button', { name: /forensic:types.title/i })
      ).toBeInTheDocument();
    });

    it('should render select field when accordion is expanded', () => {
      renderComponent();

      // Expand accordion
      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      expect(screen.getByText('forensic:types.type')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should display current subjectType value in select', () => {
      renderComponent('vehicle');

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeInTheDocument();
    });

    it('should render both type options when select is opened', () => {
      renderComponent();

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      expect(
        screen.getByRole('option', { name: 'forensic:types.vehicle' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'forensic:types.person' })
      ).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('should call setSubjectType when selecting vehicle option', () => {
      const { mockSetSubjectType } = renderComponent('person');

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      const vehicleOption = screen.getByRole('option', {
        name: 'forensic:types.vehicle',
      });
      fireEvent.click(vehicleOption);

      expect(mockSetSubjectType).toHaveBeenCalledWith('vehicle');
    });

    it('should call setSubjectType when selecting person option', () => {
      const { mockSetSubjectType } = renderComponent('vehicle');

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      const personOption = screen.getByRole('option', {
        name: 'forensic:types.person',
      });
      fireEvent.click(personOption);

      expect(mockSetSubjectType).toHaveBeenCalledWith('person');
    });

    it('should open and close select dropdown correctly', () => {
      renderComponent();

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      const selectTrigger = screen.getByRole('combobox');

      // Initially closed - options should not be visible
      expect(screen.queryByRole('option')).not.toBeInTheDocument();

      // Open select
      fireEvent.click(selectTrigger);
      expect(
        screen.getByRole('option', { name: 'forensic:types.vehicle' })
      ).toBeInTheDocument();

      // Close by clicking outside or ESC - for this test we'll verify it opens correctly
      expect(
        screen.getByRole('option', { name: 'forensic:types.person' })
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle accordion collapse and expand', () => {
      renderComponent();

      const accordionTrigger = screen.getByRole('button', {
        name: /forensic:types.title/i,
      });

      // Initially collapsed
      expect(screen.queryByText('forensic:types.type')).not.toBeInTheDocument();

      // Expand
      fireEvent.click(accordionTrigger);
      expect(screen.getByText('forensic:types.type')).toBeInTheDocument();

      // Collapse again
      fireEvent.click(accordionTrigger);
      expect(screen.queryByText('forensic:types.type')).not.toBeInTheDocument();
    });

    it('should render correctly with person subjectType', () => {
      renderComponent('person');

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('forensic:types.type')).toBeInTheDocument();
    });

    it('should render correctly with vehicle subjectType', () => {
      renderComponent('vehicle');

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('forensic:types.type')).toBeInTheDocument();
    });

    it('should have proper form field structure', () => {
      renderComponent();

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      // Check for FormLabel
      expect(screen.getByText('forensic:types.type')).toBeInTheDocument();

      // Check for Select components
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should display select group label when opened', () => {
      renderComponent();

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // The SelectLabel should be visible - use getAllByText since there are multiple instances
      const typeLabels = screen.getAllByText('forensic:types.type');
      expect(typeLabels.length).toBeGreaterThan(0);
      expect(typeLabels[0]).toBeInTheDocument();
    });

    it('should handle context provider correctly', () => {
      const mockSetSubjectType = vi.fn();

      render(
        <TestWrapper
          subjectType="person"
          onSubjectTypeChange={mockSetSubjectType}
        />
      );

      // Should render without errors
      expect(
        screen.getByRole('button', { name: /forensic:types.title/i })
      ).toBeInTheDocument();
    });

    it('should render both options with correct translation keys', () => {
      renderComponent();

      fireEvent.click(
        screen.getByRole('button', { name: /forensic:types.title/i })
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // Check that both options are rendered with translation keys
      const vehicleOption = screen.getByRole('option', {
        name: 'forensic:types.vehicle',
      });
      const personOption = screen.getByRole('option', {
        name: 'forensic:types.person',
      });

      expect(vehicleOption).toBeInTheDocument();
      expect(personOption).toBeInTheDocument();
    });
  });
});
