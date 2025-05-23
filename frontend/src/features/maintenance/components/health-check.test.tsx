import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { useAuth } from '@/providers/auth-context.tsx';
import useHealthCheck from '../hooks/use-healthCheck';
import { HealthStatus, ServiceType } from '../lib/utils/types';
import HealthCheck from './health-check';

// Mock the LoadingSpinner component
vi.mock('@/components/loading', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock the Progress component
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress-bar" role="progressbar" aria-valuenow={value}>
      Progress: {value}%
    </div>
  ),
}));

// Mock the Collapsible component
vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible">{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-trigger">{children}</div>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
}));

// Mock the useHealthCheck hook
vi.mock('../hooks/use-healthCheck', () => ({
  default: vi.fn(() => ({
    progress: 0,
    running: false,
    statuses: {},
    startHealthCheck: vi.fn(),
  })),
}));

// Mock the useAuth hook
vi.mock('@/providers/auth-context.tsx', () => ({
  useAuth: vi.fn(() => ({
    sessionId: 'test-session-id',
  })),
}));

// Mock the Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  HeartPulse: () => <div data-testid="heart-pulse-icon" />,
  Play: () => <div data-testid="play-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
}));

describe('HealthCheck', () => {
  let mockStartHealthCheck: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStartHealthCheck = vi.fn();

    // Reset and redefine the hook mock before each test
    (useHealthCheck as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({
        progress: 0,
        running: false,
        statuses: {},
        startHealthCheck: mockStartHealthCheck,
      })
    );
  });

  describe('Basic Rendering', () => {
    it('renders component without crashing', () => {
      render(<HealthCheck />);

      expect(screen.getByText('System Health Check')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Run Health Check/i })
      ).toBeInTheDocument();
    });

    it('renders start button in initial state', () => {
      render(<HealthCheck />);

      const button = screen.getByRole('button', { name: /Run Health Check/i });
      expect(button).toBeEnabled();
      expect(button).toHaveTextContent('Run Health Check');
    });
  });

  describe('Interaction Tests', () => {
    it('calls startHealthCheck when button is clicked', () => {
      render(<HealthCheck />);

      const button = screen.getByRole('button', { name: /Run Health Check/i });
      fireEvent.click(button);

      expect(mockStartHealthCheck).toHaveBeenCalledWith('test-session-id');
    });

    it('disables button and changes text when health check is running', () => {
      (
        useHealthCheck as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => ({
        progress: 25,
        running: true,
        statuses: {},
        startHealthCheck: mockStartHealthCheck,
      }));

      render(<HealthCheck />);

      const button = screen.getByRole('button', { name: /Running/i });
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Running...');
    });
  });

  describe('Advanced Features', () => {
    it('displays OK, WARNING, and ERROR statuses correctly', () => {
      const mockStatuses = {
        [ServiceType.AI_SERVICE]: {
          status: HealthStatus.OK,
          details: [],
        },
        [ServiceType.CAMERA_ACTIVITY]: {
          status: HealthStatus.WARNING,
          details: [],
        },
        [ServiceType.CAMERA_ANOMALY]: {
          status: HealthStatus.ERROR,
          details: [],
        },
      };

      // Mock the hook to simulate a running health check
      (
        useHealthCheck as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => ({
        progress: 100,
        running: false,
        statuses: mockStatuses,
        startHealthCheck: mockStartHealthCheck,
      }));

      // Setup initial render
      const { rerender } = render(<HealthCheck />);

      // Clicking the button to set hasStarted to true
      fireEvent.click(screen.getByRole('button'));

      // Rerender with the same mock to ensure UI updates
      rerender(<HealthCheck />);

      // Only verify that we can see both OK, WARNING, and ERROR states
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument(); // OK
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument(); // WARNING
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument(); // ERROR
    });

    it('displays default status color for unknown status', () => {
      const mockStatuses = {
        [ServiceType.AI_SERVICE]: {
          // @ts-expect-error Testing invalid status
          status: 'UNKNOWN_STATUS',
          details: [],
        },
      };

      (
        useHealthCheck as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => ({
        progress: 100,
        running: false,
        statuses: mockStatuses,
        startHealthCheck: mockStartHealthCheck,
      }));

      const { rerender } = render(<HealthCheck />);
      fireEvent.click(screen.getByRole('button'));
      rerender(<HealthCheck />);

      // The component should display the service name with default styling
      expect(screen.getByText(/AI Service/i)).toBeInTheDocument();
      // No status icons should be present
      expect(screen.queryByTestId('check-circle-icon')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('alert-triangle-icon')
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('x-circle-icon')).not.toBeInTheDocument();
    });

    it('displays detail items for different service types correctly', () => {
      const mockStatuses = {
        [ServiceType.CAMERA_ACTIVITY]: {
          status: HealthStatus.WARNING,
          details: [{ id: 'cam1', name: 'Camera 1', message: 'low fps' }],
        },
        [ServiceType.CAMERA_ANOMALY]: {
          status: HealthStatus.WARNING,
          details: [
            { id: 'cam2', name: 'Camera 2', message: 'detection issue' },
          ],
        },
        [ServiceType.IMAGE_IN_STREAMS]: {
          status: HealthStatus.WARNING,
          details: [{ id: 'stream1', name: 'Stream 1', message: 'buffering' }],
        },
        [ServiceType.AVERAGE_FPS]: {
          status: HealthStatus.WARNING,
          details: [
            { id: 'fps1', name: 'FPS Monitor', message: 'below threshold' },
          ],
        },
        [ServiceType.AI_SERVICE]: {
          status: HealthStatus.WARNING,
          details: [{ message: 'AI service issue' }],
        },
      };

      (
        useHealthCheck as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => ({
        progress: 100,
        running: false,
        statuses: mockStatuses,
        startHealthCheck: mockStartHealthCheck,
      }));

      const { rerender } = render(<HealthCheck />);
      fireEvent.click(screen.getByRole('button'));
      rerender(<HealthCheck />);

      // Test the details rendering for each service type
      expect(screen.getByText('Camera 1 low fps')).toBeInTheDocument();
      expect(screen.getByText('Camera 2 detection issue')).toBeInTheDocument();
      expect(screen.getByText('Stream 1 buffering')).toBeInTheDocument();
      expect(
        screen.getByText('FPS Monitor below threshold')
      ).toBeInTheDocument();
      expect(screen.getByText('AI service issue')).toBeInTheDocument();
    });

    it('handles fallbacks for missing detail properties', () => {
      const mockStatuses = {
        [ServiceType.CAMERA_ACTIVITY]: {
          status: HealthStatus.WARNING,
          details: [
            { id: 'cam1', message: 'no name provided' }, // missing name
            { name: 'Camera X', message: 'no id provided' }, // missing id
          ],
        },
        [ServiceType.AI_SERVICE]: {
          status: HealthStatus.WARNING,
          details: [
            { id: 'ai1' }, // missing message
          ],
        },
      };

      (
        useHealthCheck as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => ({
        progress: 100,
        running: false,
        statuses: mockStatuses,
        startHealthCheck: mockStartHealthCheck,
      }));

      const { rerender } = render(<HealthCheck />);
      fireEvent.click(screen.getByRole('button'));
      rerender(<HealthCheck />);

      // Test fallbacks
      expect(screen.getByText('cam1 no name provided')).toBeInTheDocument();
      expect(screen.getByText('Camera X no id provided')).toBeInTheDocument();
      // Empty string or undefined should render nothing meaningful to test
    });
  });

  describe('Edge Cases', () => {
    it('does not call startHealthCheck when sessionId is not available', () => {
      // Mock useAuth to return no sessionId
      (
        vi.mocked(useAuth) as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => ({
        sessionId: null,
      }));

      render(<HealthCheck />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockStartHealthCheck).not.toHaveBeenCalled();
    });
  });
});
