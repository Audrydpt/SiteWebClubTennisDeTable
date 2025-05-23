import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import Maintenance from './Maintenance';

// Mock the components used in Maintenance
vi.mock('@/components/header', () => ({
  default: ({ title, level = 'h1' }: { title: string; level?: string }) => (
    <div data-testid={`header-${level}`}>{title}</div>
  ),
}));

vi.mock('./components/overview', () => ({
  default: () => <div data-testid="overview-component">Overview Component</div>,
}));

vi.mock('./components/system', () => ({
  default: () => <div data-testid="system-component">System Component</div>,
}));

vi.mock('./components/webmin', () => ({
  default: () => <div data-testid="webmin-component">Webmin Component</div>,
}));

vi.mock('./components/diagnostic', () => ({
  default: () => (
    <div data-testid="diagnostic-component">Diagnostic Component</div>
  ),
}));

vi.mock('./components/firmware', () => ({
  default: () => <div data-testid="firmware-component">Firmware Component</div>,
}));

vi.mock('./components/create-restore', () => ({
  default: () => (
    <div data-testid="create-restore-component">
      Create Restore Backup Component
    </div>
  ),
}));

vi.mock('./components/health-check', () => ({
  default: () => (
    <div data-testid="health-check-component">Health Check Component</div>
  ),
}));

describe('Maintenance', () => {
  const renderComponent = () => render(<Maintenance />);

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByText('System Maintenance')).toBeInTheDocument();
    });

    it('renders all section headers correctly', () => {
      renderComponent();
      expect(screen.getByText('System Maintenance')).toBeInTheDocument();
      expect(screen.getByText('System Overview')).toBeInTheDocument();
      expect(screen.getByText('System Management')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Tasks')).toBeInTheDocument();
    });

    it('renders all child components', () => {
      renderComponent();
      expect(screen.getByTestId('overview-component')).toBeInTheDocument();
      expect(screen.getByTestId('system-component')).toBeInTheDocument();
      expect(screen.getByTestId('webmin-component')).toBeInTheDocument();
      expect(screen.getByTestId('diagnostic-component')).toBeInTheDocument();
      expect(screen.getByTestId('firmware-component')).toBeInTheDocument();
      expect(
        screen.getByTestId('create-restore-component')
      ).toBeInTheDocument();
      expect(screen.getByTestId('health-check-component')).toBeInTheDocument();
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

      expect(sections).toHaveLength(4);

      // First section contains Overview component
      expect(sections[0]).toContainElement(
        screen.getByTestId('overview-component')
      );

      // Second section contains System, Webmin and Diagnostic components
      expect(sections[1]).toContainElement(
        screen.getByTestId('system-component')
      );
      expect(sections[1]).toContainElement(
        screen.getByTestId('webmin-component')
      );
      expect(sections[1]).toContainElement(
        screen.getByTestId('diagnostic-component')
      );

      // Third section contains Firmware and CreateRestoreBackup components
      expect(sections[2]).toContainElement(
        screen.getByTestId('firmware-component')
      );
      expect(sections[2]).toContainElement(
        screen.getByTestId('create-restore-component')
      );

      // Fourth section contains HealthCheck component
      expect(sections[3]).toContainElement(
        screen.getByTestId('health-check-component')
      );
    });
  });
});
