import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import ForensicSettings from './forensic-settings';

// Mock the child components
vi.mock('./vms-settings', () => ({
  default: () => <div>Mocked VMSSettings</div>,
}));
vi.mock('./ai-settings', () => ({
  default: () => <div>Mocked IASettings</div>,
}));

describe('ForensicSettings', () => {
  const renderComponent = () => render(<ForensicSettings />);

  describe('Basic Rendering', () => {
    it('should render the component without crashing', () => {
      renderComponent();
      // No explicit assertion needed if render doesn't throw
    });

    it('should render the VMSSettings component', () => {
      renderComponent();
      expect(screen.getByText('Mocked VMSSettings')).toBeInTheDocument();
    });

    it('should render the IASettings component', () => {
      renderComponent();
      expect(screen.getByText('Mocked IASettings')).toBeInTheDocument();
    });
  });
});
