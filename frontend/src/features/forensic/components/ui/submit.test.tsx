import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Submit from './submit';

describe('Submit', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {};
    return render(<Submit {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render submit button with correct type', () => {
      renderComponent();
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render search icon', () => {
      renderComponent();
      const button = screen.getByRole('button');
      // Search icon should be present in the button
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have sticky positioning classes', () => {
      renderComponent();
      const container = screen
        .getByRole('button')
        .closest('div')?.parentElement;
      expect(container).toHaveClass('sticky', 'bottom-0', 'left-0', 'right-0');
    });

    it('should have proper z-index for overlay', () => {
      renderComponent();
      const container = screen
        .getByRole('button')
        .closest('div')?.parentElement;
      expect(container).toHaveClass('z-50');
    });

    it('should have flex layout for button container', () => {
      renderComponent();
      const buttonContainer = screen.getByRole('button').closest('div');
      expect(buttonContainer).toHaveClass('flex', 'items-center', 'gap-2');
    });

    it('should have full width button styling', () => {
      renderComponent();
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full', 'flex-1');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a button', () => {
      renderComponent();
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it('should have accessible text content', () => {
      renderComponent();
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('forensic:submit.launch');
    });

    it('should be keyboard accessible', () => {
      renderComponent();
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Icon Integration', () => {
    it('should render icon before text', () => {
      renderComponent();
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      const text = button.textContent;

      expect(svg).toBeInTheDocument();
      expect(text).toContain('forensic:submit.launch');

      // Icon should come before text in DOM order
      const svgIndex = Array.from(button.childNodes).findIndex(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).tagName === 'svg'
      );
      const textIndex = Array.from(button.childNodes).findIndex(
        (node) =>
          node.nodeType === Node.TEXT_NODE &&
          node.textContent?.includes('forensic:submit.launch')
      );

      expect(svgIndex).toBeLessThan(textIndex);
    });

    it('should have proper icon spacing', () => {
      renderComponent();
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toHaveClass('mr-2');
    });
  });
});
