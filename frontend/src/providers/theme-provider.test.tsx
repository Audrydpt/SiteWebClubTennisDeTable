import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ThemeProvider from './theme-provider';

describe('ThemeProvider', () => {
  const mockMatchMedia = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');

    window.matchMedia = mockMatchMedia.mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <div data-testid="test-child">Test Child</div>
        </ThemeProvider>
      );

      expect(getByTestId('test-child')).toBeInTheDocument();
    });

    it('applies default theme when no localStorage value exists', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <div />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });

  describe('Theme Switching', () => {
    it('applies theme from localStorage if available', () => {
      localStorage.setItem('vite-ui-theme', 'dark');

      render(
        <ThemeProvider>
          <div />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('uses custom storage key when provided', () => {
      localStorage.setItem('custom-theme-key', 'dark');

      render(
        <ThemeProvider storageKey="custom-theme-key">
          <div />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes previous theme classes when switching themes', async () => {
      localStorage.setItem('vite-ui-theme', 'light');
      const { unmount } = render(
        <ThemeProvider>
          <div />
        </ThemeProvider>
      );

      // Verify initial theme
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Unmount to trigger cleanup
      unmount();

      // Set new theme
      localStorage.setItem('vite-ui-theme', 'dark');
      render(
        <ThemeProvider>
          <div />
        </ThemeProvider>
      );

      // Verify theme switch
      expect(document.documentElement.classList.contains('light')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('System Theme', () => {
    it('applies system dark theme when system preference is dark', () => {
      window.matchMedia = mockMatchMedia.mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      render(
        <ThemeProvider defaultTheme="system">
          <div />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('applies system light theme when system preference is light', () => {
      window.matchMedia = mockMatchMedia.mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      render(
        <ThemeProvider defaultTheme="system">
          <div />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });

  describe('Theme Context', () => {
    it('persists theme change in localStorage', () => {
      localStorage.setItem('vite-ui-theme', 'dark');

      render(
        <ThemeProvider>
          <div />
        </ThemeProvider>
      );

      expect(localStorage.getItem('vite-ui-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
