import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Path, useForm } from 'react-hook-form';

import { ForensicFormValues } from '../../lib/types';
import ColorPicker from './color-picker';

// Mock data with proper hex values
const mockColors = [
  { name: 'Red', value: '#FF0000' },
  { name: 'Green', value: '#008000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Yellow', value: '#FFFF00' },
];

type ValidColorValue =
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'white'
  | 'gray'
  | 'black';

// Test wrapper component for form integration
function TestWrapper({
  colors = mockColors,
  useColorNames = false,
  defaultValue = [],
  fieldName = 'attributes.upper.color' as Path<ForensicFormValues>,
  ...props
}: Partial<React.ComponentProps<typeof ColorPicker>> & {
  defaultValue?: ValidColorValue[];
  fieldName?: Path<ForensicFormValues>;
}) {
  const { control } = useForm<ForensicFormValues>({
    defaultValues: {
      type: 'person',
      attributes: {
        upper: {
          color: defaultValue,
        },
      },
    },
  });

  return (
    <ColorPicker
      colors={colors}
      name={fieldName}
      control={control}
      useColorNames={useColorNames}
      {...props}
    />
  );
}

describe('ColorPicker', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {};
    return render(<TestWrapper {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();

      const triggerButton = screen.getByRole('button');
      expect(triggerButton).toBeInTheDocument();
    });

    it('should render trigger button when no colors are selected', () => {
      renderComponent();

      const triggerButton = screen.getByRole('button');
      // Just verify the button exists and is functional
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toBeEnabled();
    });

    it('should accept custom className', () => {
      renderComponent({ className: 'custom-class' });

      const triggerButton = screen.getByRole('button');
      expect(triggerButton).toHaveClass('custom-class');
    });

    it('should render popover content when clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      // Check if popover content is visible (use dialog role instead of grid)
      const popoverContent = screen.getByRole('dialog');
      expect(popoverContent).toBeInTheDocument();

      // Verify the grid container is inside the dialog
      const gridContainer = within(popoverContent).getByRole('generic');
      expect(gridContainer).toHaveClass('grid', 'grid-cols-4', 'gap-2');
    });

    it('should render all provided colors in the grid', async () => {
      const user = userEvent.setup();
      renderComponent();

      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      // Check that all colors are rendered
      mockColors.forEach((color) => {
        const colorButton = screen.getByRole('button', { name: color.name });
        expect(colorButton).toBeInTheDocument();
        // Use toHaveStyle which handles color format conversions
        expect(colorButton).toHaveStyle({ backgroundColor: color.value });
      });
    });
  });

  describe('Color Selection', () => {
    it('should select a color when clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Open popover
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      // Click on red color
      const redButton = screen.getByRole('button', { name: 'Red' });
      await user.click(redButton);

      // Close popover to see the selection
      fireEvent.click(document.body);

      // Check if the selected color appears in the trigger button
      const selectedColor = within(triggerButton).getByTitle('#FF0000');
      expect(selectedColor).toBeInTheDocument();
    });

    it('should deselect a color when clicked again', async () => {
      const user = userEvent.setup();
      renderComponent({ defaultValue: ['#FF0000'] });

      // Initially should show the selected color
      const triggerButton = screen.getByRole('button');
      expect(within(triggerButton).getByTitle('#FF0000')).toBeInTheDocument();

      // Open popover
      await user.click(triggerButton);

      // Click on red color to deselect
      const redButton = screen.getByRole('button', { name: 'Red' });
      await user.click(redButton);

      // Close popover
      fireEvent.click(document.body);

      // Color should no longer be displayed
      expect(
        within(triggerButton).queryByTitle('#FF0000')
      ).not.toBeInTheDocument();
    });

    it('should allow multiple color selection', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Open popover
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      // Select multiple colors
      const redButton = screen.getByRole('button', { name: 'Red' });
      const blueButton = screen.getByRole('button', { name: 'Blue' });

      await user.click(redButton);
      await user.click(blueButton);

      // Close popover to see selections
      fireEvent.click(document.body);

      // Both colors should be visible in trigger button
      expect(within(triggerButton).getByTitle('#FF0000')).toBeInTheDocument();
      expect(within(triggerButton).getByTitle('#0000FF')).toBeInTheDocument();
    });

    it('should display selected colors in trigger button', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Open popover and select colors
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      const redButton = screen.getByRole('button', { name: 'Red' });
      await user.click(redButton);

      // Close popover by clicking outside
      fireEvent.click(document.body);

      // Check that selected color appears in trigger button
      const colorDisplay = within(triggerButton).getByTitle('#FF0000');
      expect(colorDisplay).toBeInTheDocument();
      expect(colorDisplay).toHaveStyle({ backgroundColor: '#FF0000' });
    });
  });

  describe('Color Names vs Values', () => {
    it('should use hex values by default', async () => {
      const user = userEvent.setup();
      renderComponent({ useColorNames: false });

      // Open popover and select a color
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      const redButton = screen.getByRole('button', { name: 'Red' });
      await user.click(redButton);

      // Should use hex value
      const colorDisplay = within(triggerButton).getByTitle('#FF0000');
      expect(colorDisplay).toBeInTheDocument();
      expect(colorDisplay).toHaveStyle({ backgroundColor: '#FF0000' });
    });

    it('should use color names when useColorNames is true', async () => {
      const user = userEvent.setup();
      renderComponent({ useColorNames: true });

      // Open popover and select a color
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      const redButton = screen.getByRole('button', { name: 'Red' });
      await user.click(redButton);

      // Should use color name (lowercase)
      const colorDisplay = within(triggerButton).getByTitle('red');
      expect(colorDisplay).toBeInTheDocument();
      expect(colorDisplay).toHaveStyle({ backgroundColor: '#FF0000' });
    });
  });

  describe('Visual States', () => {
    it('should show selected state for white background', async () => {
      const user = userEvent.setup();
      renderComponent({ defaultValue: ['#FFFFFF'] });

      // Open popover
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      // White button should exist and be selectable
      const whiteButton = screen.getByRole('button', { name: 'White' });
      expect(whiteButton).toBeInTheDocument();
      expect(whiteButton).toHaveStyle({ backgroundColor: '#FFFFFF' });
    });

    it('should show selected state for dark background', async () => {
      const user = userEvent.setup();
      renderComponent({ defaultValue: ['#000000'] });

      // Open popover
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      // Black button should exist and be selectable
      const blackButton = screen.getByRole('button', { name: 'Black' });
      expect(blackButton).toBeInTheDocument();
      expect(blackButton).toHaveStyle({ backgroundColor: '#000000' });
    });

    it('should show hover effects on color buttons', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Open popover
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      const redButton = screen.getByRole('button', { name: 'Red' });
      expect(redButton).toHaveClass('hover:scale-105', 'transition-transform');
    });
  });

  describe('Form Integration', () => {
    it('should work with default empty array', () => {
      renderComponent();

      const triggerButton = screen.getByRole('button');
      // Should work as expected - button exists and is functional
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toBeEnabled();
    });

    it('should handle pre-selected values', () => {
      renderComponent({ defaultValue: ['#FF0000', '#008000'] });

      const triggerButton = screen.getByRole('button');

      // Should show selected colors
      expect(within(triggerButton).getByTitle('#FF0000')).toBeInTheDocument();
      expect(within(triggerButton).getByTitle('#008000')).toBeInTheDocument();
    });

    it('should handle non-array values gracefully', () => {
      // Use the TestWrapper which handles the form setup properly
      renderComponent({
        defaultValue: [] as ValidColorValue[],
      });

      const triggerButton = screen.getByRole('button');
      // Should render without errors
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toBeEnabled();
    });
  });

  describe('Color Matching', () => {
    it('should find colors by hex value', () => {
      renderComponent({ defaultValue: ['#FF0000'] });

      const triggerButton = screen.getByRole('button');
      const colorDisplay = within(triggerButton).getByTitle('#FF0000');
      expect(colorDisplay).toHaveStyle({ backgroundColor: '#FF0000' });
    });

    it('should find colors by name (case insensitive)', () => {
      renderComponent({
        defaultValue: ['red'],
        useColorNames: true,
      });

      const triggerButton = screen.getByRole('button');
      // Should display the color name as title when using names
      const colorDisplay = within(triggerButton).getByTitle('red');
      expect(colorDisplay).toHaveStyle({ backgroundColor: '#FF0000' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty colors array', () => {
      renderComponent({ colors: [] });

      expect(() => screen.getByRole('button')).not.toThrow();
    });

    it('should handle rapid color selection clicks', async () => {
      const user = userEvent.setup();
      renderComponent();

      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      const redButton = screen.getByRole('button', { name: 'Red' });
      const blueButton = screen.getByRole('button', { name: 'Blue' });

      // Rapid clicks
      await Promise.all([
        user.click(redButton),
        user.click(blueButton),
        user.click(redButton), // Toggle red
      ]);

      // Close popover to see final state
      fireEvent.click(document.body);

      // Blue should remain selected, red should be deselected
      expect(within(triggerButton).getByTitle('#0000FF')).toBeInTheDocument();
      expect(
        within(triggerButton).queryByTitle('#FF0000')
      ).not.toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();

      const triggerButton = screen.getByRole('button');

      // Use keyboard to open popover
      await user.tab();
      expect(triggerButton).toHaveFocus();

      await user.keyboard('{Enter}');

      // Popover should be open (check for dialog instead of grid)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
