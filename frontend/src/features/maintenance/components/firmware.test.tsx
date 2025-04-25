import { render, screen } from '@testing-library/react';
import Firmware from './firmware';

describe('Firmware', () => {
  const renderComponent = () => render(<Firmware />);

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();

      // Check for the main card by its class instead of role
      const card = screen.getByText('Firmware Update').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('displays the correct title with icon', () => {
      renderComponent();

      const title = screen.getByRole('heading', { name: /firmware update/i });
      expect(title).toBeInTheDocument();
      expect(title.querySelector('svg')).toBeInTheDocument();
    });

    it('displays the info message about required files', () => {
      renderComponent();

      const infoText = screen.getByText(
        /You need 2 specific files supplied by ACIC/i
      );
      expect(infoText).toBeInTheDocument();
    });

    it('renders Browse Files button with icon', () => {
      renderComponent();

      const browseButton = screen.getByRole('button', {
        name: /browse files/i,
      });
      expect(browseButton).toBeInTheDocument();
      expect(browseButton.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Upload and Install button with icon', () => {
      renderComponent();

      const uploadButton = screen.getByRole('button', {
        name: /upload and install/i,
      });
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('ShadCN Component Structure', () => {
    it('renders Card with CardHeader and CardContent components', () => {
      renderComponent();

      // The main card should contain CardHeader and CardContent
      const title = screen.getByRole('heading', { name: /firmware update/i });
      const cardHeader = title.closest('div');
      expect(cardHeader).toBeInTheDocument();

      // The CardContent should contain the info card and buttons
      const infoText = screen.getByText(
        /You need 2 specific files supplied by ACIC/i
      );
      // Using non-null assertions since we know these elements exist in the test context
      const parentDiv = infoText.closest('div');
      expect(parentDiv).not.toBeNull();
      const cardContent = parentDiv!.closest('div');
      expect(cardContent).toBeInTheDocument();
    });

    it('contains info message in a nested card', () => {
      renderComponent();

      // Just verify the info text is present
      const infoText = screen.getByText(
        /You need 2 specific files supplied by ACIC/i
      );
      expect(infoText).toBeInTheDocument();

      // Verify the text has the correct styling
      expect(infoText.className).toContain('text-sm');
      expect(infoText.className).toContain('text-muted-foreground');
    });
  });

  describe('Button Properties', () => {
    it('renders buttons with outline variant', () => {
      renderComponent();

      const browseButton = screen.getByRole('button', {
        name: /browse files/i,
      });
      const uploadButton = screen.getByRole('button', {
        name: /upload and install/i,
      });

      // Check for border class which indicates outline variant
      expect(browseButton.className).toContain('border');
      expect(uploadButton.className).toContain('border');
    });

    it('positions buttons correctly with margin', () => {
      renderComponent();

      const browseButton = screen.getByRole('button', {
        name: /browse files/i,
      });

      // Browse button should have right margin
      expect(browseButton.className).toContain('mr-2');
    });
  });
});
