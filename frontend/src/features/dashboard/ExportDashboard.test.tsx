/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ExportDashboard from './ExportDashboard';
import { ExportStep } from './lib/export';
import { AcicAggregation, AcicEvent } from './lib/props';

// Mock the step components
vi.mock('./components/export/export-source', () => ({
  default: ({ updateStoredWidget, setStepValidity }: ExportStep) => (
    <div data-testid="export-step-source">
      <h2>Source Step</h2>
      <button
        type="button"
        onClick={() => {
          updateStoredWidget({
            table: AcicEvent.AcicCounting,
            range: { from: new Date(), to: new Date() },
            stream: 'test-stream',
          });
          setStepValidity(true);
        }}
      >
        Validate Source
      </button>
    </div>
  ),
}));

vi.mock('./components/export/export-options', () => ({
  default: ({
    storedWidget,
    updateStoredWidget,
    setStepValidity,
  }: ExportStep) => (
    <div data-testid="export-step-options">
      <h2>Options Step</h2>
      <button
        type="button"
        onClick={() => {
          updateStoredWidget({
            aggregation: AcicAggregation.OneHour,
            groupBy: 'column1,column2',
            where: [{ column: 'test', value: 'value' }],
          });
          setStepValidity(true);
        }}
      >
        Validate Options
      </button>
    </div>
  ),
}));

vi.mock('./components/export/export-format', () => ({
  default: ({
    storedWidget,
    updateStoredWidget,
    setStepValidity,
  }: ExportStep) => (
    <div data-testid="export-step-format">
      <h2>Format Step</h2>
      <button
        type="button"
        onClick={() => {
          updateStoredWidget({ format: 'Excel' });
          setStepValidity(true);
        }}
      >
        Validate Format
      </button>
    </div>
  ),
}));

// Mock the header component
vi.mock('@/components/header', () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

describe('ExportDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render header with correct title', () => {
      render(<ExportDashboard />);
      expect(screen.getByText('dashboard:export.title')).toBeInTheDocument();
    });

    it('should render stepper with all three steps', () => {
      render(<ExportDashboard />);
      expect(screen.getByText('Source')).toBeInTheDocument();
      expect(screen.getByText('Options')).toBeInTheDocument();
      expect(screen.getByText('Format')).toBeInTheDocument();
    });

    it('should render the first step content by default', () => {
      render(<ExportDashboard />);
      expect(screen.getByTestId('export-step-source')).toBeInTheDocument();
    });

    it('should have Next button disabled initially', () => {
      render(<ExportDashboard />);
      const nextButton = screen.getByRole('button', {
        name: 'dashboard:export.next',
      });
      expect(nextButton).toBeDisabled();
    });

    it('should have Previous button disabled on first step', () => {
      render(<ExportDashboard />);
      const prevButton = screen.getByRole('button', {
        name: 'dashboard:export.previous',
      });
      expect(prevButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should enable Next button when first step is valid', async () => {
      render(<ExportDashboard />);
      const validateButton = screen.getByRole('button', {
        name: 'Validate Source',
      });
      await userEvent.click(validateButton);

      const nextButton = screen.getByRole('button', {
        name: 'dashboard:export.next',
      });
      expect(nextButton).not.toBeDisabled();
    });

    it('should navigate to second step when Next is clicked', async () => {
      render(<ExportDashboard />);

      // Validate the first step
      const validateSourceButton = screen.getByRole('button', {
        name: 'Validate Source',
      });
      await userEvent.click(validateSourceButton);

      // Click Next to go to the second step
      const nextButton = screen.getByRole('button', {
        name: 'dashboard:export.next',
      });
      await userEvent.click(nextButton);

      // Should show the second step component
      expect(screen.getByTestId('export-step-options')).toBeInTheDocument();
      // Previous button should be enabled
      const prevButton = screen.getByRole('button', {
        name: 'dashboard:export.previous',
      });
      expect(prevButton).not.toBeDisabled();
    });

    it('should enable Next button when second step is valid', async () => {
      render(<ExportDashboard />);

      // Validate first step and go to second step
      const validateSourceButton = screen.getByRole('button', {
        name: 'Validate Source',
      });
      await userEvent.click(validateSourceButton);
      const nextButton = screen.getByRole('button', {
        name: 'dashboard:export.next',
      });
      await userEvent.click(nextButton);

      // Validate second step
      const validateOptionsButton = screen.getByRole('button', {
        name: 'Validate Options',
      });
      await userEvent.click(validateOptionsButton);

      // Next button should be enabled
      const updatedNextButton = screen.getByRole('button', {
        name: 'dashboard:export.next',
      });
      expect(updatedNextButton).not.toBeDisabled();
    });

    it('should navigate to third step when Next is clicked from second step', async () => {
      render(<ExportDashboard />);

      // Step 1: Validate and navigate to step 2
      const validateSourceButton = screen.getByRole('button', {
        name: 'Validate Source',
      });
      await userEvent.click(validateSourceButton);
      const nextButton = screen.getByRole('button', {
        name: 'dashboard:export.next',
      });
      await userEvent.click(nextButton);

      // Step 2: Validate and navigate to step 3
      const validateOptionsButton = screen.getByRole('button', {
        name: 'Validate Options',
      });
      await userEvent.click(validateOptionsButton);
      const nextButtonStep2 = screen.getByRole('button', {
        name: 'dashboard:export.next',
      });
      await userEvent.click(nextButtonStep2);

      // Should show the third step component
      expect(screen.getByTestId('export-step-format')).toBeInTheDocument();
    });

    it('should show Reset button on the last step', async () => {
      render(<ExportDashboard />);

      // Navigate through steps
      const validateSourceButton = screen.getByRole('button', {
        name: 'Validate Source',
      });
      await userEvent.click(validateSourceButton);
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.next' })
      );

      const validateOptionsButton = screen.getByRole('button', {
        name: 'Validate Options',
      });
      await userEvent.click(validateOptionsButton);
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.next' })
      );

      // On last step, the Next button should now say Reset
      expect(
        screen.getByRole('button', { name: 'dashboard:export.reset' })
      ).toBeInTheDocument();
    });

    it('should go back to previous step when Previous is clicked', async () => {
      render(<ExportDashboard />);

      // Navigate to step 2
      const validateSourceButton = screen.getByRole('button', {
        name: 'Validate Source',
      });
      await userEvent.click(validateSourceButton);
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.next' })
      );

      // Go back to step 1
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.previous' })
      );

      // Should show the first step again
      expect(screen.getByTestId('export-step-source')).toBeInTheDocument();
    });
  });

  describe('Form Data Management', () => {
    it('should maintain form data between steps when navigating back and forth', async () => {
      render(<ExportDashboard />);

      // Step 1: Set data and navigate to step 2
      const validateSourceButton = screen.getByRole('button', {
        name: 'Validate Source',
      });
      await userEvent.click(validateSourceButton);
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.next' })
      );

      // Step 2: Set data and navigate to step 3
      const validateOptionsButton = screen.getByRole('button', {
        name: 'Validate Options',
      });
      await userEvent.click(validateOptionsButton);
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.next' })
      );

      // Step 3: Set data
      const validateFormatButton = screen.getByRole('button', {
        name: 'Validate Format',
      });
      await userEvent.click(validateFormatButton);

      // Go back to step 2
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.previous' })
      );

      // Go back to step 1
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.previous' })
      );

      // Go forward to step 2 again
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.next' })
      );

      // Next button should still be enabled because form data is preserved
      expect(
        screen.getByRole('button', { name: 'dashboard:export.next' })
      ).not.toBeDisabled();
    });

    it('should reset form and return to first step when Reset button is clicked', async () => {
      render(<ExportDashboard />);

      // Navigate through all steps
      const validateSourceButton = screen.getByRole('button', {
        name: 'Validate Source',
      });
      await userEvent.click(validateSourceButton);
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.next' })
      );

      const validateOptionsButton = screen.getByRole('button', {
        name: 'Validate Options',
      });
      await userEvent.click(validateOptionsButton);
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.next' })
      );

      const validateFormatButton = screen.getByRole('button', {
        name: 'Validate Format',
      });
      await userEvent.click(validateFormatButton);

      // Click Reset
      await userEvent.click(
        screen.getByRole('button', { name: 'dashboard:export.reset' })
      );

      // Should go back to step 1
      expect(screen.getByTestId('export-step-source')).toBeInTheDocument();
    });
  });
});
