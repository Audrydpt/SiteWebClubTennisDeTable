import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NoSidebarLayout from './NoSidebarLayout';

describe('NoSidebarLayout', () => {
  const renderComponent = (initialEntries = ['/']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<NoSidebarLayout />}>
            <Route index element={<div>Child Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render Outlet content', () => {
      renderComponent();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should have correct container classes', () => {
      renderComponent();
      const container = screen.getByText('Child Content').parentElement;
      expect(container).toHaveClass('mx-auto');
      expect(container).toHaveClass('max-w-6xl');
      expect(container).toHaveClass('flex-wrap');
      expect(container).toHaveClass('items-start');
      expect(container).toHaveClass('gap-6');
      expect(container).toHaveClass('p-6');
      expect(container).toHaveClass('sm:p-8');
    });
  });
});
