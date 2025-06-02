import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Params from './params';

// Mock only the child form components (not ShadCN components)
vi.mock('../paramsForm/sources', () => ({
  default: () => <div>Sources Component</div>,
}));

vi.mock('../paramsForm/times', () => ({
  default: () => <div>Times Component</div>,
}));

vi.mock('../paramsForm/types', () => ({
  default: () => <div>Types Component</div>,
}));

vi.mock('../paramsForm/appareances', () => ({
  default: () => <div>Appearances Component</div>,
}));

vi.mock('../paramsForm/attributes', () => ({
  default: () => <div>Attributes Component</div>,
}));

describe('Params', () => {
  const renderComponent = () => render(<Params />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();

      // Test that the main container exists by checking for scrollable content
      expect(screen.getByText('Sources Component')).toBeInTheDocument();
    });

    it('should render all child components', () => {
      renderComponent();

      expect(screen.getByText('Sources Component')).toBeInTheDocument();
      expect(screen.getByText('Times Component')).toBeInTheDocument();
      expect(screen.getByText('Types Component')).toBeInTheDocument();
      expect(screen.getByText('Appearances Component')).toBeInTheDocument();
      expect(screen.getByText('Attributes Component')).toBeInTheDocument();
    });

    it('should have proper structure with scrollable area', () => {
      const { container } = renderComponent();

      // Check that the component has the expected class structure
      const scrollArea = container.querySelector('.flex-1');
      expect(scrollArea).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render all form sections', () => {
      renderComponent();

      // Verify all 5 expected sections are present
      const expectedSections = [
        'Sources Component',
        'Times Component',
        'Types Component',
        'Appearances Component',
        'Attributes Component',
      ];

      expectedSections.forEach((sectionText) => {
        expect(screen.getByText(sectionText)).toBeInTheDocument();
      });
    });

    it('should maintain consistent rendering across rerenders', () => {
      const { rerender } = renderComponent();

      // Verify initial state
      expect(screen.getByText('Sources Component')).toBeInTheDocument();

      // Rerender and verify consistency
      rerender(<Params />);
      expect(screen.getByText('Sources Component')).toBeInTheDocument();
      expect(screen.getAllByText(/Component$/)).toHaveLength(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle component unmounting cleanly', () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });

    it('should render efficiently with multiple rerenders', () => {
      const { rerender } = renderComponent();

      // Multiple rapid rerenders
      for (let i = 0; i < 3; i += 1) {
        rerender(<Params />);
      }

      // Should still work correctly
      expect(screen.getAllByText(/Component$/)).toHaveLength(5);
    });
  });
});
