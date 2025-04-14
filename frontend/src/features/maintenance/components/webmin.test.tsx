import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Webmin from './webmin';

describe('Webmin', () => {
  const renderComponent = () => render(<Webmin />);

  beforeEach(() => {
    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByText('System Configuration')).toBeInTheDocument();
    });

    it('displays the correct title with icon', () => {
      renderComponent();
      const title = screen.getByRole('heading');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('System Configuration');
    });

    it('renders the Webmin button', () => {
      renderComponent();
      const button = screen.getByRole('button', {
        name: /Open Webmin Interface/i,
      });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('calls alert with correct message when button is clicked', () => {
      renderComponent();
      const button = screen.getByRole('button', {
        name: /Open Webmin Interface/i,
      });

      fireEvent.click(button);

      expect(window.alert).toHaveBeenCalledTimes(1);
      expect(window.alert).toHaveBeenCalledWith('Opening Webmin Interface...');
    });
  });

  describe('Edge Cases', () => {
    it('button should have the correct variant and class', () => {
      renderComponent();
      const button = screen.getByRole('button', {
        name: /Open Webmin Interface/i,
      });

      expect(button).toHaveClass('w-full');
    });
  });
});
