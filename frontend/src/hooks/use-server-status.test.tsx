import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useServerStatus from './use-server-status';

describe('useServerStatus hook', () => {
  // Store environment
  const originalEnv = { ...process.env };

  // Mock fetch
  let mockFetch: ReturnType<typeof vi.fn>;
  let originalFetch: typeof global.fetch;

  // For testing interval callbacks
  let intervalCallback: () => Promise<void>;
  let intervalId: number;

  beforeEach(() => {
    // Prepare environment
    process.env.BACK_API_URL = 'http://test-api.com';

    // Mock fetch
    originalFetch = global.fetch;
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;

    // Mock setInterval
    vi.spyOn(global, 'setInterval').mockImplementation((callback, ms) => {
      intervalCallback = callback as () => Promise<void>;
      intervalId = ms ?? 123;
      return intervalId as unknown as NodeJS.Timeout;
    });

    // Mock clearInterval
    vi.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;

    // Restore fetch
    global.fetch = originalFetch;

    vi.restoreAllMocks();
  });

  it('should initialize with isOnline as false', () => {
    mockFetch.mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useServerStatus('test-session-id'));
    expect(result.current.isOnline).toBe(false);
  });

  it('should update isOnline to true when fetch returns ok', async () => {
    // Mock a successful response
    const mockResponse = { ok: true };
    mockFetch.mockResolvedValue(mockResponse);

    let hookResult: { result: { current: { isOnline: boolean } } } | undefined;

    // Render the hook within act
    await act(async () => {
      hookResult = renderHook(() => useServerStatus('test-session-id'));

      // Allow the promise in useEffect to resolve
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    // Verify fetch was called with the right parameters
    expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/streams', {
      headers: {
        Authorization: 'X-Session-Id test-session-id',
      },
    });

    // Verify the state was updated
    expect(hookResult!.result.current.isOnline).toBe(true);
  });

  it('should clean up interval on unmount', () => {
    // Render and unmount the hook
    const { unmount } = renderHook(() => useServerStatus('test-session-id'));
    unmount();

    // Verify clearInterval was called with the right ID
    expect(clearInterval).toHaveBeenCalledWith(intervalId);
  });

  it('should update isOnline to false when fetch returns not ok', async () => {
    // First the initial check returns true
    mockFetch.mockResolvedValueOnce({ ok: true });

    // Then the interval check returns false
    const mockFailResponse = { ok: false };
    mockFetch.mockResolvedValueOnce(mockFailResponse);

    let hookResult: { result: { current: { isOnline: boolean } } } | undefined;

    // Render hook and wait for initial state update
    await act(async () => {
      hookResult = renderHook(() => useServerStatus('test-session-id'));

      // Allow the promise in useEffect to resolve
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    // Verify initial state is true
    expect(hookResult!.result.current.isOnline).toBe(true);

    // Trigger the interval callback and wait for state update
    await act(async () => {
      await intervalCallback();
    });

    // Verify state was updated to false
    expect(hookResult!.result.current.isOnline).toBe(false);
  });

  it('should update isOnline to false when fetch throws error', async () => {
    // First the initial check returns true
    mockFetch.mockResolvedValueOnce({ ok: true });

    // Then the interval check throws an error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    let hookResult: { result: { current: { isOnline: boolean } } } | undefined;

    // Render hook and wait for initial state update
    await act(async () => {
      hookResult = renderHook(() => useServerStatus('test-session-id'));

      // Allow the promise in useEffect to resolve
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    // Verify initial state is true
    expect(hookResult!.result.current.isOnline).toBe(true);

    // Trigger the interval callback and wait for state update
    await act(async () => {
      await intervalCallback();
    });

    // Verify state was updated to false
    expect(hookResult!.result.current.isOnline).toBe(false);
  });
});
