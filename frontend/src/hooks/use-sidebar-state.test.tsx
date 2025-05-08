import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useSidebarState from './use-sidebar-state';

describe('useSidebarState', () => {
  const originalInnerWidth = window.innerWidth;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
  });

  describe('Initial state', () => {
    it('should default to open if window width is >= 1024px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useSidebarState());
      expect(result.current.open).toBe(true);
    });

    it('should default to closed if window width is < 1024px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1023,
      });

      const { result } = renderHook(() => useSidebarState());
      expect(result.current.open).toBe(false);
    });

    it('should respect the initialState parameter when provided', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024, // Would normally default to true
      });

      const { result } = renderHook(() => useSidebarState(false));
      expect(result.current.open).toBe(false);

      const { result: result2 } = renderHook(() => useSidebarState(true));
      expect(result2.current.open).toBe(true);
    });
  });

  describe('State changes', () => {
    it('should update state when setOpen is called', () => {
      const { result } = renderHook(() => useSidebarState(false));
      expect(result.current.open).toBe(false);

      act(() => {
        result.current.setOpen(true);
      });

      expect(result.current.open).toBe(true);

      act(() => {
        result.current.setOpen(false);
      });

      expect(result.current.open).toBe(false);
    });
  });

  describe('Resize listener', () => {
    it('should add resize event listener on mount', () => {
      renderHook(() => useSidebarState());
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    it('should remove resize event listener on unmount', () => {
      const { unmount } = renderHook(() => useSidebarState());
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    it('should update state when window is resized', () => {
      // Initialize with a small window
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 800,
      });

      const { result } = renderHook(() => useSidebarState());
      expect(result.current.open).toBe(false);

      // Simulate resize to a large window
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          value: 1200,
        });
        // Manually trigger the resize event
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.open).toBe(true);

      // Simulate resize to a small window again
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          value: 900,
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.open).toBe(false);
    });
  });
});
