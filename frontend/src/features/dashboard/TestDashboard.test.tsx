import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TestDashboard from './TestDashboard';

describe('TestDashboard', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TestDashboard />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('w-full', 'grid', 'grid-cols-3', 'gap-2');
    });
  });
});
