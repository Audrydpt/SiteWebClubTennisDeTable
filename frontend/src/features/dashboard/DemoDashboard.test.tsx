import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DemoDashboard from './DemoDashboard';

describe('DemoDashboard', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<DemoDashboard />);
      expect(container.firstChild).toBeDefined();
    });
  });
});
