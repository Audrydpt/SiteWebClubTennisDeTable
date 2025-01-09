import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useLocalStorage from './use-localstorage';

describe('useLocalStorage', () => {
  describe('Basic Functionality', () => {
    it('should initialize with default value when localStorage is empty', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'defaultValue')
      );
      expect(result.current.value).toBe('defaultValue');
    });

    it('should initialize with value from localStorage if it exists', () => {
      localStorage.setItem('testKey', JSON.stringify('storedValue'));
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'defaultValue')
      );
      expect(result.current.value).toBe('storedValue');
    });

    it('should handle different data types correctly', () => {
      const testCases = [
        { value: 42, key: 'numberTest' },
        { value: { name: 'test' }, key: 'objectTest' },
        { value: [1, 2, 3], key: 'arrayTest' },
        { value: true, key: 'booleanTest' },
      ];

      testCases.forEach(({ value, key }) => {
        const { result } = renderHook(() => useLocalStorage(key, value));
        expect(result.current.value).toEqual(value);
      });
    });
  });

  describe('setValue Function', () => {
    it('should update both state and localStorage when setting new value', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      );

      act(() => {
        result.current.setValue('newValue');
      });

      expect(result.current.value).toBe('newValue');
      expect(JSON.parse(localStorage.getItem('testKey') || '')).toBe(
        'newValue'
      );
    });

    it('should return true when value is successfully set', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      );

      let setResult;
      act(() => {
        setResult = result.current.setValue('newValue');
      });

      expect(setResult).toBe(true);
    });

    it('should not update if new value is identical to current value', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'testValue')
      );
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      act(() => {
        result.current.setValue('testValue');
      });

      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should use default value if localStorage.getItem throws', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementationOnce(() => {
        throw new Error('getItem error');
      });

      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'defaultValue')
      );
      expect(result.current.value).toBe('defaultValue');
    });

    it('should use default value if JSON.parse throws', () => {
      localStorage.setItem('testKey', 'invalid json');
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'defaultValue')
      );
      expect(result.current.value).toBe('defaultValue');
    });

    it('should return false when setValue fails', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementationOnce(() => {
        throw new Error('setItem error');
      });

      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      );

      let setResult;
      act(() => {
        setResult = result.current.setValue('newValue');
      });

      expect(setResult).toBe(false);
    });
  });
});
