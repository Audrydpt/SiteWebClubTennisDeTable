import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MultiSelect from './multi-select';

describe('MultiSelect', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {
      options: ['Option 1', 'Option 2', 'Option 3'],
      selected: [],
      onChange: vi.fn(),
      placeholder: 'Select options...',
    };

    return render(<MultiSelect {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('renders with default placeholder when no options are selected', () => {
      renderComponent();
      expect(screen.getByRole('combobox')).toHaveTextContent(
        'Select options...'
      );
    });

    it('renders selected options when provided', () => {
      renderComponent({ selected: ['Option 1', 'Option 2'] });
      expect(screen.getByRole('combobox')).toHaveTextContent(
        'Option 1 | Option 2'
      );
    });

    it('renders clear button when options are selected', () => {
      renderComponent({ selected: ['Option 1'] });
      expect(
        screen.getByRole('button', { name: 'Clear selection' })
      ).toBeInTheDocument();
    });

    it('does not render clear button when no options are selected', () => {
      renderComponent({ selected: [] });
      expect(
        screen.queryByRole('button', { name: 'Clear selection' })
      ).not.toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('opens popover when clicking the trigger', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('combobox'));
      expect(
        screen.getByPlaceholderText('Select options...')
      ).toBeInTheDocument();
    });

    it('calls onChange with selected item when clicking an option', () => {
      const onChange = vi.fn();
      renderComponent({ onChange });

      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('Option 1'));

      expect(onChange).toHaveBeenCalledWith(['Option 1']);
    });

    it('removes item from selection when clicking a selected option', () => {
      const onChange = vi.fn();
      renderComponent({
        selected: ['Option 1', 'Option 2'],
        onChange,
      });

      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('Option 1'));

      expect(onChange).toHaveBeenCalledWith(['Option 2']);
    });

    it('clears all selections when clicking the clear button', () => {
      const onChange = vi.fn();
      renderComponent({
        selected: ['Option 1', 'Option 2'],
        onChange,
      });

      fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('selects all options when clicking the "All" button', () => {
      const onChange = vi.fn();
      renderComponent({ onChange });

      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('whereClauseSearch.all'));

      expect(onChange).toHaveBeenCalledWith([
        'Option 1',
        'Option 2',
        'Option 3',
      ]);
    });

    it('clears all options when clicking the "Clear" button with all selected', () => {
      const onChange = vi.fn();
      renderComponent({
        selected: ['Option 1', 'Option 2', 'Option 3'],
        onChange,
      });

      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('whereClauseSearch.clear'));

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      renderComponent({ options: [] });
      fireEvent.click(screen.getByRole('combobox'));
      expect(
        screen.getByText('whereClauseSearch.noResults')
      ).toBeInTheDocument();
    });

    it('handles search functionality', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('combobox'));

      const searchInput = screen.getByPlaceholderText('Select options...');
      fireEvent.change(searchInput, { target: { value: 'Option 1' } });

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
    });

    it('handles case-insensitive search', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('combobox'));

      const searchInput = screen.getByPlaceholderText('Select options...');
      fireEvent.change(searchInput, { target: { value: 'option 1' } });

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
  });
});
