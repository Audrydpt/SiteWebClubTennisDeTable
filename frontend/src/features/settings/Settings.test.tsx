import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import Settings from './Settings';

// Mock the components used in Settings
vi.mock('@/components/header', () => ({
  default: ({ title, level = 'h1' }: { title: string; level?: string }) => (
    <div data-testid={`header-${level}`}>{title}</div>
  ),
}));

vi.mock('./components/users', () => ({
  default: () => <div data-testid="users-component">Users Component</div>,
}));

vi.mock('./components/retention', () => ({
  default: () => (
    <div data-testid="retention-component">Retention Component</div>
  ),
}));

vi.mock('./components/forensic-settings', () => ({
  default: () => (
    <div data-testid="forensic-settings-component">
      settings:headers.forensicSettings Component
    </div>
  ),
}));

describe('Settings', () => {
  const renderComponent = () => render(<Settings />);

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(
        screen.getByText('settings:headers.systemSettings')
      ).toBeInTheDocument();
    });

    it('renders all section headers correctly', () => {
      renderComponent();
      expect(
        screen.getByText('settings:headers.systemSettings')
      ).toBeInTheDocument();
      expect(
        screen.getByText('settings:headers.usersManagement')
      ).toBeInTheDocument();
      expect(
        screen.getByText('settings:headers.retentionSettings')
      ).toBeInTheDocument();
      expect(
        screen.getByText('settings:headers.forensicSettings')
      ).toBeInTheDocument();
    });

    it('renders all child components', () => {
      renderComponent();
      expect(screen.getByTestId('users-component')).toBeInTheDocument();
      expect(screen.getByTestId('retention-component')).toBeInTheDocument();
      expect(
        screen.getByTestId('forensic-settings-component')
      ).toBeInTheDocument();
    });

    it('renders correct header levels', () => {
      renderComponent();

      // Main header (h1)
      expect(screen.getByTestId('header-h1')).toBeInTheDocument();

      // Section headers (h2)
      const h2Headers = screen.getAllByTestId('header-h2');
      expect(h2Headers).toHaveLength(3);
    });
  });

  describe('Component Structure', () => {
    it('renders sections in the correct order', () => {
      const { container } = renderComponent();
      const sections = container.querySelectorAll('section');

      expect(sections).toHaveLength(3);

      // First section contains Users component
      expect(sections[0]).toContainElement(
        screen.getByTestId('users-component')
      );

      // Second section contains Retention component
      expect(sections[1]).toContainElement(
        screen.getByTestId('retention-component')
      );

      // Third section contains ForensicSettings component
      expect(sections[2]).toContainElement(
        screen.getByTestId('forensic-settings-component')
      );
    });
  });
});
