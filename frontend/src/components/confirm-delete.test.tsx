import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DeleteConfirmation from './confirm-delete';

describe('DeleteConfirmation', () => {
  const defaultProps = {
    onDelete: vi.fn(),
    children: <Button>Test</Button>,
  };

  describe('Basic Rendering', () => {
    it('renders the trigger element (children)', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
    });

    it('dialog is not visible by default', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('renders with default props when not provided', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Test' }));

      expect(screen.getByText('Êtes-vous sûr ?')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Cette action est irréversible et ne pourra pas être annulée.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Annuler' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Supprimer' })
      ).toBeInTheDocument();
    });

    it('renders with custom props when provided', () => {
      const customProps = {
        ...defaultProps,
        title: 'Custom Title',
        description: 'Custom Description',
        cancelText: 'Custom Cancel',
        confirmText: 'Custom Confirm',
      };

      render(<DeleteConfirmation {...customProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Test' }));

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Custom Cancel' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Custom Confirm' })
      ).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('opens dialog when trigger is clicked', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Test' }));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('calls onDelete when confirm button is clicked', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Test' }));
      fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
    });

    it('does not call onDelete when cancel button is clicked', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Test' }));
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(defaultProps.onDelete).not.toHaveBeenCalled();
    });

    it('closes dialog when cancel button is clicked', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Test' }));
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('closes dialog when confirm button is clicked', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Test' }));
      fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty strings for text props', () => {
      const emptyProps = {
        ...defaultProps,
        title: '',
        description: '',
        cancelText: '',
        confirmText: '',
      };

      render(<DeleteConfirmation {...emptyProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Test' }));

      // Even with empty strings, buttons should still be present and clickable
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
    });

    it('prevents event propagation on delete button click', () => {
      const parentClick = vi.fn();
      const testId = 'parent-card';

      render(
        <Card
          data-testid={testId}
          className="hover:cursor-pointer"
          onClick={parentClick}
        >
          <DeleteConfirmation {...defaultProps} />
        </Card>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Test' }));
      fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
      expect(parentClick).not.toHaveBeenCalled();
    });
  });
});
