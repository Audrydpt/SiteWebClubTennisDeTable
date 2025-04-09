/**
 * Test utilities for Next.js applications
 */
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { vi } from 'vitest';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/current-path',
  }),
  usePathname: () => '/current-path',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, ...props }: any) => (
    <img src={src} alt={alt} width={width} height={height} {...props} />
  ),
}));

/**
 * Custom render function with Next.js app router providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { ...options }),
  };
}

/**
 * Mock window.matchMedia for responsive tests
 */
export function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Mock cursor position in a contentEditable element
 */
export function mockCursorPosition(element: HTMLElement, position: number) {
  // Create a text node if it doesn't exist
  if (!element.firstChild) {
    element.textContent = '';
  }

  const textNode = element.firstChild as Text;
  const selection = window.getSelection();

  if (!selection) return;

  selection.removeAllRanges();

  const range = document.createRange();
  range.setStart(textNode, Math.min(position, textNode.length || 0));
  range.setEnd(textNode, Math.min(position, textNode.length || 0));

  selection.addRange(range);

  // Dispatch input event to trigger React handlers
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Wait for Next.js dynamic imports to resolve
 */
export async function waitForDynamicImports() {
  // Return a promise that resolves on the next macro task
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create a custom keyboard event
 */
export function createKeyboardEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  options: Partial<KeyboardEventInit> = {}
) {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

/**
 * Mock intersection observer for components that rely on it
 */
export function mockIntersectionObserver() {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });

  window.IntersectionObserver = mockIntersectionObserver;

  return mockIntersectionObserver;
}

/**
 * Mock the URL API for testing route changes
 */
export function mockUrl(url: string) {
  const originalLocation = window.location;
  const mockLocation = new URL(url);

  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      ...mockLocation,
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
  });

  return () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  };
}
