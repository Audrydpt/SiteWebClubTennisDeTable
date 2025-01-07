import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LoadingSpinner from './loading';

describe('LoadingSpinner', () => {
  describe('Basic Rendering', () => {
    it('renders with correct container classes', () => {
      const { container } = render(<LoadingSpinner />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('animate-spin');
    });

    it('accepts className prop and applies it correctly', () => {
      const { container } = render(<LoadingSpinner className="test-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('test-class');
    });
  });
});
