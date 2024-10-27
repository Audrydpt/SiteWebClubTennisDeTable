import { useState } from 'react';

export default function useLocalStorage<T>(key: string, defaultValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = (value: T) => {
    try {
      if (JSON.stringify(value) === JSON.stringify(storedValue)) {
        return true;
      }

      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
    return true;
  };

  return { value: storedValue, setValue };
}
