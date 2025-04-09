import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useServerStatus from '@/hooks/use-server-status';
import { UserPrivileges, UserType } from '@/lib/authenticate';
import { useAuth } from '@/providers/auth-context';
import RebootStatus from './reboot-status';

// Mock the dependencies
vi.mock('@/hooks/use-server-status');
vi.mock('@/providers/auth-context');
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

describe('RebootStatus', () => {
  const mockOnRebootComplete = vi.fn();
  const mockSessionId = 'test-session-id';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock useAuth hook
    vi.mocked(useAuth).mockReturnValue({
      sessionId: mockSessionId,
      user: {
        user: 'testuser',
        privileges: UserPrivileges.Administrator,
      } as UserType,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    // Default mock for useServerStatus
    vi.mocked(useServerStatus).mockReturnValue({ isOnline: false });

    // Mock window.location.reload
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: vi.fn() },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly when server is offline', () => {
    render(<RebootStatus onRebootComplete={mockOnRebootComplete} />);

    expect(screen.getByText('Rebooting server...')).toBeInTheDocument();
    expect(
      screen.getByText(/Waiting for server to come back online/)
    ).toBeInTheDocument();
    expect(screen.getByText(/20s/)).toBeInTheDocument();
  });

  it('counts down timer when server is offline', async () => {
    render(<RebootStatus onRebootComplete={mockOnRebootComplete} />);

    // Initial state
    expect(screen.getByText(/20s/)).toBeInTheDocument();

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Check that timer decreased
    expect(screen.getByText(/19s/)).toBeInTheDocument();

    // Advance timer by 10 more seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Check that timer decreased further
    expect(screen.getByText(/9s/)).toBeInTheDocument();
  });

  it('resets timer when it reaches 0 and server is still offline', async () => {
    render(<RebootStatus onRebootComplete={mockOnRebootComplete} />);

    // Advance timer by 20 seconds to reach 0
    act(() => {
      vi.advanceTimersByTime(20000);
    });

    // Timer should reset to 20
    expect(screen.getByText(/20s/)).toBeInTheDocument();
  });

  it('shows server online message when server comes back online', async () => {
    // Start with server offline
    vi.mocked(useServerStatus).mockReturnValue({ isOnline: false });

    render(<RebootStatus onRebootComplete={mockOnRebootComplete} />);

    // Change server status to online
    vi.mocked(useServerStatus).mockReturnValue({ isOnline: true });

    // Force re-render
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Check for online message
    expect(
      screen.getByText('Server is back online! Closing soon...')
    ).toBeInTheDocument();
  });

  it('calls onRebootComplete and reloads page after server comes back online', async () => {
    // Start with server online
    vi.mocked(useServerStatus).mockReturnValue({ isOnline: true });

    render(<RebootStatus onRebootComplete={mockOnRebootComplete} />);

    // Advance timer by 2 seconds (the delay before calling onRebootComplete)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Check that onRebootComplete was called
    expect(mockOnRebootComplete).toHaveBeenCalledTimes(1);

    // Check that window.location.reload was called
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('passes sessionId to useServerStatus hook', () => {
    render(<RebootStatus onRebootComplete={mockOnRebootComplete} />);

    // Verify the hook was called with the correct sessionId
    expect(useServerStatus).toHaveBeenCalledWith(mockSessionId);
  });

  it('handles null sessionId gracefully', () => {
    // Mock sessionId as null
    vi.mocked(useAuth).mockReturnValue({
      sessionId: undefined,
      user: {
        user: 'testuser',
        privileges: UserPrivileges.Anonymous,
      } as UserType,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<RebootStatus onRebootComplete={mockOnRebootComplete} />);

    // Verify the hook was called with empty string
    expect(useServerStatus).toHaveBeenCalledWith('');
  });
});
