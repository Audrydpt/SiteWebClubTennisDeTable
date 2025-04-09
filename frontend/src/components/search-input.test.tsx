import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SearchInput from './search-input';

describe('SearchInput', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {
      value: '',
      onChange: vi.fn(),
    };

    return render(<SearchInput {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('renders with default placeholder', () => {
      renderComponent();

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('accepts className prop and applies it correctly', () => {
      renderComponent({ className: 'test-class' });

      expect(screen.getByPlaceholderText('Search...')).toHaveClass(
        'test-class'
      );
    });

    it('renders clear button when value is provided', () => {
      renderComponent({ value: 'test query' });

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('does not render clear button when value is empty', () => {
      renderComponent({ value: '' });

      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('uses custom placeholder when provided', () => {
      renderComponent({ placeholder: 'Custom placeholder' });

      expect(
        screen.getByPlaceholderText('Custom placeholder')
      ).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('calls onChange when typing in input', () => {
      const onChange = vi.fn();
      renderComponent({ onChange });

      fireEvent.change(screen.getByPlaceholderText('Search...'), {
        target: { value: 'test query' },
      });

      expect(onChange).toHaveBeenCalledWith('test query');
    });

    it('calls onChange with empty string when clicking clear button', () => {
      const onChange = vi.fn();
      renderComponent({ value: 'test query', onChange });

      fireEvent.click(screen.getByLabelText('Clear search'));

      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string in onChange', () => {
      const onChange = vi.fn();
      renderComponent({ value: 'test', onChange });

      fireEvent.change(screen.getByPlaceholderText('Search...'), {
        target: { value: '' },
      });

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('handles special characters in search', () => {
      const onChange = vi.fn();
      renderComponent({ onChange });

      fireEvent.change(screen.getByPlaceholderText('Search...'), {
        target: { value: 'test@#$%^&' },
      });

      expect(onChange).toHaveBeenCalledWith('test@#$%^&');
    });
  });
});
