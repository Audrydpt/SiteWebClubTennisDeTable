import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WhereClausesWithSearch } from './where-clauses-with-search';

// Mock MultiSelect component
vi.mock('./multi-select', () => ({
  default: ({
    options,
    selected,
    onChange,
  }: {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
  }) => (
    <div data-testid="multi-select">
      <input
        data-testid="multi-select-input"
        value={selected.join('|||')}
        onChange={(e) => onChange(e.target.value.split('|||'))}
      />
      <button
        type="button"
        data-testid="multi-select-toggle"
        onClick={() => {
          const select = document.createElement('div');
          select.setAttribute('role', 'listbox');
          select.className = 'multi-select-options';
          options.forEach((option: string) => {
            const item = document.createElement('div');
            item.setAttribute('role', 'option');
            item.textContent = option;
            item.onclick = () => onChange([...selected, option]);
            select.appendChild(item);
          });
          document.body.appendChild(select);
        }}
      >
        Toggle
      </button>
    </div>
  ),
}));

describe('WhereClausesWithSearch', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {
      columns: ['name', 'age', 'email'] as const,
      value: [],
      onValueChange: vi.fn(),
      whereClauseAutocompletion: {
        name: new Set(['John', 'Jane', 'Bob']),
        age: new Set(['20', '30', '40']),
        email: new Set(['john@example.com', 'jane@example.com']),
      },
    };

    return render(<WhereClausesWithSearch {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('renders an add filter button when no filters exist', () => {
      renderComponent();

      expect(
        screen.getByRole('button', { name: 'Add filter' })
      ).toBeInTheDocument();
    });

    it('accepts className prop and applies it correctly', () => {
      renderComponent({ className: 'test-class' });

      expect(
        screen.getByRole('button', { name: 'Add filter' }).parentElement
      ).toHaveClass('test-class');
    });

    it('disables all inputs when disabled prop is true', () => {
      renderComponent({
        value: [{ column: 'name', value: '' }],
        disabled: true,
      });

      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Add filter' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Remove filter' })
      ).toBeDisabled();
    });

    it('disables add button when all columns are used', () => {
      const allColumns = [
        { column: 'name', value: '' },
        { column: 'age', value: '' },
        { column: 'email', value: '' },
      ];

      renderComponent({ value: allColumns });

      const addButton = screen.getByRole('button', { name: 'Add filter' });
      expect(addButton).toBeDisabled();
    });
  });

  describe('Interaction Tests', () => {
    it('adds a new filter when clicking add button', async () => {
      const onValueChange = vi.fn();
      renderComponent({ onValueChange });

      fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));

      expect(onValueChange).toHaveBeenCalledWith([
        { column: 'name', value: '' },
      ]);
    });

    it('removes a filter when clicking remove button', async () => {
      const onValueChange = vi.fn();
      const initialFilters = [
        { column: 'name', value: 'John|||Jane' },
        { column: 'age', value: '20' },
      ];

      renderComponent({
        value: initialFilters,
        onValueChange,
      });

      const removeButtons = screen.getAllByRole('button', {
        name: 'Remove filter',
      });
      fireEvent.click(removeButtons[0]);

      expect(onValueChange).toHaveBeenCalledWith([
        { column: 'age', value: '20' },
      ]);
    });

    it('updates filter value when changing MultiSelect', async () => {
      const onValueChange = vi.fn();
      renderComponent({
        value: [{ column: 'name', value: '' }],
        onValueChange,
      });

      fireEvent.change(screen.getByTestId('multi-select-input'), {
        target: { value: 'John|||Jane' },
      });

      expect(onValueChange).toHaveBeenCalledWith([
        { column: 'name', value: 'John|||Jane' },
      ]);
    });

    it('only updates the targeted filter while preserving others', async () => {
      const onValueChange = vi.fn();
      const initialFilters = [
        { column: 'name', value: 'John|||Jane' },
        { column: 'age', value: '20' },
      ];

      renderComponent({
        value: initialFilters,
        onValueChange,
      });

      const inputs = screen.getAllByTestId('multi-select-input');
      fireEvent.change(inputs[1], { target: { value: '30' } });

      expect(onValueChange).toHaveBeenCalledWith([
        { column: 'name', value: 'John|||Jane' },
        { column: 'age', value: '30' },
      ]);
    });

    it('updates filter column when selecting new column', async () => {
      const onValueChange = vi.fn();
      renderComponent({
        value: [{ column: 'name', value: 'John|||Jane' }],
        onValueChange,
      });

      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('age'));

      expect(onValueChange).toHaveBeenCalledWith([
        { column: 'age', value: '' },
      ]);
    });

    it('excludes used columns from available options', async () => {
      const onValueChange = vi.fn();
      renderComponent({
        value: [{ column: 'name', value: '' }],
        onValueChange,
      });

      fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));

      expect(onValueChange).toHaveBeenCalledWith([
        { column: 'name', value: '' },
        { column: 'age', value: '' },
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty columns array', () => {
      renderComponent({ columns: [] });

      const addButton = screen.getByRole('button', { name: 'Add filter' });
      expect(addButton).toBeDisabled();
    });

    it('handles empty whereClauseAutocompletion', () => {
      renderComponent({
        value: [{ column: 'name', value: '' }],
        whereClauseAutocompletion: {},
      });

      // Should not throw any errors
      expect(screen.getByTestId('multi-select')).toBeInTheDocument();
    });

    it('resets value when column is changed', () => {
      const onValueChange = vi.fn();
      renderComponent({
        value: [{ column: 'name', value: 'John|||Jane' }],
        onValueChange,
      });

      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('age'));

      expect(onValueChange).toHaveBeenCalledWith([
        { column: 'age', value: '' },
      ]);
    });

    it('handles columns not present in whereClauseAutocompletion', () => {
      renderComponent({
        value: [{ column: 'unknown', value: '' }],
        whereClauseAutocompletion: {
          name: new Set(['John']),
        },
      });

      // Should not throw any errors
      expect(screen.getByTestId('multi-select')).toBeInTheDocument();
    });
  });
});
