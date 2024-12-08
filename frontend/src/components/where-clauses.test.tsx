import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WhereClauses } from './where-clauses';

describe('WhereClauses', () => {
  const defaultProps = {
    columns: ['name', 'age', 'email'] as const,
    value: [],
    onValueChange: () => {},
  };

  describe('Basic Rendering', () => {
    it('renders an add filter button when no filters exist', () => {
      render(<WhereClauses {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Add filter' })
      ).toBeInTheDocument();
    });

    it('accepts className prop and applies it correctly', () => {
      render(<WhereClauses {...defaultProps} className="test-class" />);

      expect(
        screen.getByRole('button', { name: 'Add filter' }).parentElement
      ).toHaveClass('test-class');
    });

    it('disables all inputs when disabled prop is true', () => {
      render(
        <WhereClauses
          {...defaultProps}
          value={[{ column: 'name', value: '' }]}
          disabled
        />
      );

      expect(screen.getByPlaceholderText('Value')).toBeDisabled();
      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Add filter' })).toBeDisabled();
    });

    it('disables add button when all columns are used', () => {
      const allColumns = [
        { column: 'name', value: '' },
        { column: 'age', value: '' },
        { column: 'email', value: '' },
      ];

      render(<WhereClauses {...defaultProps} value={allColumns} />);

      const addButton = screen.getByRole('button', { name: 'Add filter' });
      expect(addButton).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('adds a new filter when clicking add button', () => {
      const handleChange = vi.fn();
      render(<WhereClauses {...defaultProps} onValueChange={handleChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));

      expect(handleChange).toHaveBeenCalledWith([
        { column: 'name', value: '' },
      ]);
    });

    it('removes a filter when clicking remove button', () => {
      const handleChange = vi.fn();
      const initialFilters = [
        { column: 'name', value: 'John' },
        { column: 'age', value: '25' },
      ];

      render(
        <WhereClauses
          {...defaultProps}
          value={initialFilters}
          onValueChange={handleChange}
        />
      );

      const removeButtons = screen.getAllByRole('button', {
        name: 'Remove filter',
      });
      fireEvent.click(removeButtons[0]);

      expect(handleChange).toHaveBeenCalledWith([
        { column: 'age', value: '25' },
      ]);
    });

    it('updates filter value when typing in input', () => {
      const handleChange = vi.fn();
      render(
        <WhereClauses
          {...defaultProps}
          value={[{ column: 'name', value: '' }]}
          onValueChange={handleChange}
        />
      );

      fireEvent.change(screen.getByPlaceholderText('Value'), {
        target: { value: 'John' },
      });

      expect(handleChange).toHaveBeenCalledWith([
        { column: 'name', value: 'John' },
      ]);
    });

    it('only updates the targeted filter while preserving others', () => {
      const handleChange = vi.fn();
      const initialFilters = [
        { column: 'name', value: 'John' },
        { column: 'age', value: '25' },
      ];

      render(
        <WhereClauses
          {...defaultProps}
          value={initialFilters}
          onValueChange={handleChange}
        />
      );

      const inputs = screen.getAllByPlaceholderText('Value');
      fireEvent.change(inputs[1], { target: { value: '30' } });

      expect(handleChange).toHaveBeenCalledWith([
        { column: 'name', value: 'John' },
        { column: 'age', value: '30' },
      ]);
    });

    it('updates filter column when selecting new column', () => {
      const handleChange = vi.fn();
      render(
        <WhereClauses
          {...defaultProps}
          value={[{ column: 'name', value: '' }]}
          onValueChange={handleChange}
        />
      );

      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('age'));

      expect(handleChange).toHaveBeenCalledWith([{ column: 'age', value: '' }]);
    });

    it('excludes used columns from available options', () => {
      const handleChange = vi.fn();
      render(
        <WhereClauses
          {...defaultProps}
          value={[{ column: 'name', value: '' }]}
          onValueChange={handleChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));

      expect(handleChange).toHaveBeenCalledWith([
        { column: 'name', value: '' },
        { column: 'age', value: '' },
      ]);
    });
  });
});
