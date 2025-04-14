import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import System from './system';

vi.mock('lucide-react', () => ({
  Power: () => <div data-mocked="power-icon" />,
}));

describe('System', () => {
  const renderComponent = () => render(<System />);

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByText('System Control')).toBeInTheDocument();
    });

    it('renders the title with an icon', () => {
      renderComponent();
      expect(screen.getByText('System Control')).toBeInTheDocument();
      // Check that the Power icon is mocked and rendered
      expect(
        document.querySelector('[data-mocked="power-icon"]')
      ).toBeInTheDocument();
    });

    it('renders the Stop System button with destructive variant', () => {
      renderComponent();
      const stopButton = screen.getByRole('button', { name: /stop system/i });
      expect(stopButton).toBeInTheDocument();
      expect(stopButton).toHaveClass('bg-destructive');
    });

    it('renders the Reboot System button with default variant', () => {
      renderComponent();
      const rebootButton = screen.getByRole('button', {
        name: /reboot system/i,
      });
      expect(rebootButton).toBeInTheDocument();
      // Default buttons have bg-primary class in shadcn
      expect(rebootButton).not.toHaveClass('bg-destructive');
    });

    it('applies full width class to buttons', () => {
      renderComponent();
      const stopButton = screen.getByRole('button', { name: /stop system/i });
      const rebootButton = screen.getByRole('button', {
        name: /reboot system/i,
      });

      expect(stopButton).toHaveClass('w-full');
      expect(rebootButton).toHaveClass('w-full');
    });

    it('applies margin top to reboot button', () => {
      renderComponent();
      const rebootButton = screen.getByRole('button', {
        name: /reboot system/i,
      });

      expect(rebootButton).toHaveClass('mt-2');
    });
  });
});
