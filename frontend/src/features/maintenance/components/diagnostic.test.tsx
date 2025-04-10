import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import useDump from '../hooks/use-dump';
import Diagnostic from './diagnostic';

// Mock the useDump hook
vi.mock('../hooks/use-dump', () => ({
  default: vi.fn(() => ({
    downloadDump: vi.fn(),
    loading: false,
  })),
}));

describe('Diagnostic', () => {
  const renderComponent = () => render(<Diagnostic />);

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByText('System Diagnostic')).toBeInTheDocument();
    });

    it('renders both buttons correctly', () => {
      renderComponent();
      expect(
        screen.getByRole('button', { name: /Create Server Report/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Access Netdata/i })
      ).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('calls downloadDump when Create Server Report button is clicked', async () => {
      const mockDownloadDump = vi.fn();
      vi.mocked(useDump).mockReturnValue({
        downloadDump: mockDownloadDump,
        loading: false,
      });

      renderComponent();
      const user = userEvent.setup();
      const button = screen.getByRole('button', {
        name: /Create Server Report/i,
      });

      await user.click(button);

      expect(mockDownloadDump).toHaveBeenCalledTimes(1);
    });

    it('disables the button and shows loading state when loading is true', () => {
      vi.mocked(useDump).mockReturnValue({
        downloadDump: vi.fn(),
        loading: true,
      });

      renderComponent();

      const button = screen.getByRole('button', { name: /Generating Report/i });
      expect(button).toBeDisabled();
      expect(
        screen.queryByText(/Create Server Report/i)
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Generating Report/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('still renders Netdata button even when report generation is loading', () => {
      vi.mocked(useDump).mockReturnValue({
        downloadDump: vi.fn(),
        loading: true,
      });

      renderComponent();

      expect(
        screen.getByRole('button', { name: /Access Netdata/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Access Netdata/i })
      ).not.toBeDisabled();
    });
  });
});
