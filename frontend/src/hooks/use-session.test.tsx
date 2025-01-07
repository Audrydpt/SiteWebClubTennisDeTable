import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import useSession from './use-session';

describe('useSession', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  const setCookies = (cookies: string[]) => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: cookies.join('; '),
    });
  };

  describe('Basic Functionality', () => {
    it('should initialize with undefined when no SID cookie exists', () => {
      const { result } = renderHook(() => useSession());
      expect(result.current).toBeUndefined();
    });

    it('should return SID value when cookie exists', () => {
      setCookies(['SID=test-session-id']);
      const { result } = renderHook(() => useSession());
      expect(result.current).toBe('test-session-id');
    });

    it('should handle multiple cookies correctly', () => {
      setCookies(['other=value1', 'SID=test-session-id', 'another=value2']);
      const { result } = renderHook(() => useSession());
      expect(result.current).toBe('test-session-id');
    });
  });

  describe('Cookie Parsing', () => {
    it('should handle cookies with spaces correctly', () => {
      setCookies(['SID=test-session-id']);
      const { result } = renderHook(() => useSession());
      expect(result.current).toBe('test-session-id');
    });

    it('should handle cookies with special characters', () => {
      setCookies(['SID=test%20session%20id']);
      const { result } = renderHook(() => useSession());
      expect(result.current).toBe('test%20session%20id');
    });

    it('should handle empty cookie value', () => {
      setCookies(['SID=']);
      const { result } = renderHook(() => useSession());
      expect(result.current).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed cookies', () => {
      setCookies(['malformed-cookie', 'SID=test-session-id']);
      const { result } = renderHook(() => useSession());
      expect(result.current).toBe('test-session-id');
    });

    it('should handle duplicate SID cookies (last one wins)', () => {
      setCookies(['SID=first-session-id', 'SID=second-session-id']);
      const { result } = renderHook(() => useSession());
      expect(result.current).toBe('second-session-id');
    });

    it('should handle case-sensitive cookie names', () => {
      setCookies(['sid=lowercase', 'SID=uppercase']);
      const { result } = renderHook(() => useSession());
      expect(result.current).toBe('uppercase');
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle cookie changes', () => {
      const { result } = renderHook(() => useSession());
      expect(result.current).toBeUndefined();

      setCookies(['SID=new-session-id']);
      const { result: newResult } = renderHook(() => useSession());
      expect(newResult.current).toBe('new-session-id');
    });
  });
});
