import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@/components/ui/button';
import Header from './header';

describe('Header', () => {
  describe('Basic Rendering', () => {
    it('renders with title and children', () => {
      const { container } = render(
        <Header title="Test Title">
          <Button>Test Button</Button>
        </Header>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Button')).toBeInTheDocument();

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass(
        'flex',
        'flex-row',
        'justify-between',
        'items-center',
        'w-full'
      );
    });

    it('accepts and applies className prop correctly', () => {
      const { container } = render(
        <Header title="Test" className="test-class">
          <Button>Test Button</Button>
        </Header>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('test-class');
      expect(wrapper).toHaveClass(
        'flex',
        'flex-row',
        'justify-between',
        'items-center',
        'w-full'
      );
    });
  });

  describe('Props and Content', () => {
    it('renders title with correct styling', () => {
      render(
        <Header title="Test Title">
          <div />
        </Header>
      );

      const heading = screen.getByText('Test Title');
      expect(heading).toHaveClass('text-3xl', 'font-bold');
      expect(heading.tagName.toLowerCase()).toBe('h1');
    });

    it('renders multiple children with correct spacing', () => {
      const { container } = render(
        <Header title="Test">
          <Button>Button 1</Button>
          <Button>Button 2</Button>
        </Header>
      );

      const childrenContainer = container.querySelector('.flex.space-x-2');
      expect(childrenContainer).toBeInTheDocument();
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
    });

    it('handles empty children gracefully', () => {
      render(<Header title="Test">{[]}</Header>);

      const childrenContainer = screen
        .getByText('Test')
        .parentElement?.querySelector('.flex.space-x-2');
      expect(childrenContainer).toBeInTheDocument();
      expect(childrenContainer?.children.length).toBe(0);
    });
  });

  describe('HTML Attributes', () => {
    it('passes through additional HTML attributes', () => {
      const { container } = render(
        <Header title="Test" data-testid="header" aria-label="Header">
          <div />
        </Header>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveAttribute('data-testid', 'header');
      expect(wrapper).toHaveAttribute('aria-label', 'Header');
    });
  });
});
