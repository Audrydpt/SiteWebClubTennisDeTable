import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  mockAddEventListener,
  mockRemoveEventListener,
} from '../../vitest-setup';

import useIsMobile from './use-mobile';

describe('useIsMobile', () => {
  describe('Basic Functionality', () => {
    it('should initialize correctly', () => {
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('boolean');
    });

    it('should return false for desktop width', () => {
      window.innerWidth = 1024;
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should return true for mobile width', () => {
      window.innerWidth = 375;
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false for exactly mobile breakpoint', () => {
      window.innerWidth = 768;
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    it('should add event listener on mount', () => {
      renderHook(() => useIsMobile());
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useIsMobile());
      unmount();
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should update value when media query changes', () => {
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simulate media query change
      act(() => {
        window.innerWidth = 375;
        const changeEvent = mockAddEventListener.mock.calls[0][1];
        changeEvent();
      });

      expect(result.current).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle window resize around breakpoint', () => {
      const { result } = renderHook(() => useIsMobile());

      // Test just below breakpoint
      act(() => {
        window.innerWidth = 767;
        const changeEvent = mockAddEventListener.mock.calls[0][1];
        changeEvent();
      });
      expect(result.current).toBe(true);

      // Test just at breakpoint
      act(() => {
        window.innerWidth = 768;
        const changeEvent = mockAddEventListener.mock.calls[0][1];
        changeEvent();
      });
      expect(result.current).toBe(false);

      // Test just above breakpoint
      act(() => {
        window.innerWidth = 769;
        const changeEvent = mockAddEventListener.mock.calls[0][1];
        changeEvent();
      });
      expect(result.current).toBe(false);
    });
  });
});
