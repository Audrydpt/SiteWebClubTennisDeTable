import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LoadingSpinner from './loading';

describe('LoadingSpinner', () => {
  it('renders svg with default classes', () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('applies additional classes through className prop', () => {
    const { container } = render(<LoadingSpinner className="text-red-500" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin', 'text-red-500');
  });
});
