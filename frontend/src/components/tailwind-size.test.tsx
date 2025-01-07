import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import TailwindSizeIndicator from './tailwind-size';

describe('TailwindSizeIndicator', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
  });

  describe('Basic Rendering', () => {
    it('renders with correct container classes', () => {
      const { container } = render(<TailwindSizeIndicator />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('fixed', 'top-0', 'right-0', 'z-50');
    });

    it('accepts className prop and applies it correctly', () => {
      const { container } = render(
        <TailwindSizeIndicator className="test-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('test-class');
    });
  });

  describe('Visibility Classes', () => {
    it('shows XS only on xs screens', () => {
      window.innerWidth = 320 - 1;
      render(<TailwindSizeIndicator />);
      const xs = screen.getByText('XS');
      expect(xs).toHaveClass('xs:block', 'sm:hidden');
    });

    it('shows SM only on sm screens', () => {
      window.innerWidth = 640 - 1;
      render(<TailwindSizeIndicator />);
      const sm = screen.getByText('SM');
      expect(sm).toHaveClass('hidden', 'sm:block', 'md:hidden');
    });

    it('shows MD only on md screens', () => {
      window.innerWidth = 768 - 1;
      render(<TailwindSizeIndicator />);
      const md = screen.getByText('MD');
      expect(md).toHaveClass('hidden', 'md:block', 'lg:hidden');
    });

    it('shows LG only on lg screens', () => {
      window.innerWidth = 1024 - 1;
      render(<TailwindSizeIndicator />);
      const lg = screen.getByText('LG');
      expect(lg).toHaveClass('hidden', 'lg:block', 'xl:hidden');
    });

    it('shows XL only on xl screens', () => {
      window.innerWidth = 1280 - 1;
      render(<TailwindSizeIndicator />);
      const xl = screen.getByText('XL');
      expect(xl).toHaveClass('hidden', 'xl:block', '2xl:hidden');
    });

    it('shows 2XL only on 2xl screens', () => {
      window.innerWidth = 1536 - 1;
      render(<TailwindSizeIndicator />);
      const xxl = screen.getByText('2XL');
      expect(xxl).toHaveClass('hidden', '2xl:block');
    });
  });
});
