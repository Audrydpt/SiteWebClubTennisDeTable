import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DemoDashboard from './DemoDashboard';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock getBoundingClientRect for chart containers
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 500,
  height: 300,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  x: 0,
  y: 0,
  toJSON: () => {},
}));

// Mock useQuery
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    }),
  };
});

describe('DemoDashboard', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<DemoDashboard />);
      expect(container.firstChild).toBeDefined();
    });
  });
});
