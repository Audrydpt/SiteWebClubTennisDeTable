import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import useOverview from '../hooks/use-overview';
import Overview from './overview';

// Mock the custom hook
vi.mock('../hooks/use-overview');

describe('Overview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all three cards correctly', () => {
      // Mock successful data loading
      vi.mocked(useOverview).mockReturnValue({
        version: '1.0.0',
        productVersion: '2.0.0',
        isLoading: false,
        error: null,
      });

      render(<Overview />);

      // Check card titles
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('Current Versions')).toBeInTheDocument();
      expect(screen.getByText('Last Backup')).toBeInTheDocument();

      // Check card contents
      expect(screen.getByText('Operational')).toBeInTheDocument();
      expect(
        screen.getByText('Last checked: 5 minutes ago')
      ).toBeInTheDocument();

      expect(screen.getByText('API Version')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Product Version')).toBeInTheDocument();
      expect(screen.getByText('2.0.0')).toBeInTheDocument();

      expect(screen.getByText('7 days ago')).toBeInTheDocument();
      expect(screen.getByText('Next scheduled: In 2 days')).toBeInTheDocument();
    });
  });

  describe('VersionDisplay', () => {
    it('shows loading state', () => {
      // Mock loading state
      vi.mocked(useOverview).mockReturnValue({
        version: '',
        productVersion: '',
        isLoading: true,
        error: null,
      });

      render(<Overview />);

      expect(screen.getByText('Current Versions')).toBeInTheDocument();
      // Find svg loading spinner by its class
      const spinner = document.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Ensure version information is not displayed during loading
      expect(screen.queryByText('API Version')).not.toBeInTheDocument();
      expect(screen.queryByText('Product Version')).not.toBeInTheDocument();
    });

    it('shows error state', () => {
      // Mock error state
      const errorMessage = 'Failed to load version data';
      vi.mocked(useOverview).mockReturnValue({
        version: '',
        productVersion: '',
        isLoading: false,
        error: errorMessage,
      });

      render(<Overview />);

      expect(screen.getByText('Current Versions')).toBeInTheDocument();
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();

      // Ensure version information is not displayed during error
      expect(screen.queryByText('API Version')).not.toBeInTheDocument();
      expect(screen.queryByText('Product Version')).not.toBeInTheDocument();
    });

    it('shows version information when loaded successfully', () => {
      // Mock successful data loading
      vi.mocked(useOverview).mockReturnValue({
        version: '1.5.0',
        productVersion: '3.2.1',
        isLoading: false,
        error: null,
      });

      render(<Overview />);

      expect(screen.getByText('API Version')).toBeInTheDocument();
      expect(screen.getByText('1.5.0')).toBeInTheDocument();
      expect(screen.getByText('Product Version')).toBeInTheDocument();
      expect(screen.getByText('3.2.1')).toBeInTheDocument();
    });
  });
});
