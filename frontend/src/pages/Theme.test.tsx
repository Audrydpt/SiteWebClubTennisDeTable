import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Theme from './Theme';

describe('Theme', () => {
  const renderComponent = () => render(<Theme />);

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      // Check for page title
      expect(screen.getByText('Thème')).toBeInTheDocument();
    });

    it('should render color sections', () => {
      renderComponent();
      expect(screen.getByText('Couleurs de base')).toBeInTheDocument();
      expect(screen.getByText('bg-background')).toBeInTheDocument();
      expect(screen.getByText('bg-primary')).toBeInTheDocument();
    });

    it('should render component examples', () => {
      renderComponent();
      expect(screen.getByText('Exemples de composants')).toBeInTheDocument();
      expect(screen.getByText('Buttons')).toBeInTheDocument();
      expect(screen.getByText('Badges')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
    });

    it('should render card variants', () => {
      renderComponent();
      expect(screen.getByText('Card Default')).toBeInTheDocument();
      expect(screen.getByText('Card Muted')).toBeInTheDocument();
    });

    it('should render the tabs example', () => {
      renderComponent();
      expect(screen.getByText('Tabs Example')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Account' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Password' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument();
    });

    it('should render the table example', () => {
      renderComponent();
      expect(screen.getByText('Table Example')).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Name' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Role' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Status' })
      ).toBeInTheDocument();
    });

    it('should render the form example', () => {
      renderComponent();
      expect(screen.getByText('Form Example')).toBeInTheDocument();
    });
  });
});
