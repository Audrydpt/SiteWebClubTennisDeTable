import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Header from './header';

describe('Header', () => {
  it('renders title correctly', () => {
    render(<Header title="Test Title">Child content</Header>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toHaveClass('text-3xl', 'font-bold');
  });

  it('renders children in correct container', () => {
    render(
      <Header title="Test">
        <span>Child 1</span>
        <span>Child 2</span>
      </Header>
    );

    const container = screen.getByText('Child 1').closest('.flex.space-x-2');
    expect(container).toBeInTheDocument();
    expect(container).toContainElement(screen.getByText('Child 2'));
  });

  it('maintains flex layout structure', () => {
    const { container } = render(<Header title="Test">Content</Header>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass(
      'flex',
      'flex-row',
      'justify-between',
      'items-center',
      'w-full'
    );
  });
});
