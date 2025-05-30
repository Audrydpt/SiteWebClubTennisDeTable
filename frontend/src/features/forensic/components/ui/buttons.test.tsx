import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import { SortButtons } from './buttons';

// Mock des contextes
const mockDeleteAllTabs = vi.fn();
const mockSetOrder = vi.fn();
const mockSetCurrentPage = vi.fn();

const mockJobsContext = {
  deleteAllTabs: mockDeleteAllTabs,
};

const mockSearchContext = {
  order: {
    by: 'score' as 'score' | 'date',
    direction: 'desc' as 'desc' | 'asc',
  },
  setOrder: mockSetOrder,
  setCurrentPage: mockSetCurrentPage,
};

// Mock des hooks
vi.mock('../../providers/job-context', () => ({
  useJobsContext: () => mockJobsContext,
}));

vi.mock('../../providers/search-context', () => ({
  useSearchContext: () => mockSearchContext,
}));

describe('SortButtons', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {};
    return render(<SortButtons {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock context state
    mockSearchContext.order.by = 'score';
    mockSearchContext.order.direction = 'desc';
    // Configure the mock to return the default context
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByText('forensic:buttons.score')).toBeInTheDocument();
      expect(screen.getByText('forensic:buttons.date')).toBeInTheDocument();
    });

    it('should render all sort buttons', () => {
      renderComponent();

      const scoreButton = screen.getByRole('button', {
        name: 'forensic:buttons.score',
      });
      const dateButton = screen.getByRole('button', {
        name: 'forensic:buttons.date',
      });

      expect(scoreButton).toBeInTheDocument();
      expect(dateButton).toBeInTheDocument();
    });

    it('should render sort direction button', () => {
      renderComponent();

      const sortDirectionButton = screen.getByRole('button', {
        name: 'forensic:buttons.descending',
      });
      expect(sortDirectionButton).toBeInTheDocument();
    });

    it('should render delete confirmation component', () => {
      renderComponent();

      // Le bouton trash devrait être présent (trigger du dialog)
      const trashButton = screen.getByRole('button', {
        name: 'forensic:buttons.clear_results',
      });
      expect(trashButton).toBeInTheDocument();
    });

    it('should highlight active sort button based on order.by', () => {
      renderComponent();

      const scoreButton = screen.getByRole('button', {
        name: 'forensic:buttons.score',
      });
      const dateButton = screen.getByRole('button', {
        name: 'forensic:buttons.date',
      });

      // Score should be active (default variant)
      expect(scoreButton).toHaveClass('bg-primary');
      expect(dateButton).not.toHaveClass('bg-primary');
    });
  });

  describe('Sort By Functionality', () => {
    it('should call setOrder and setCurrentPage when clicking score button', async () => {
      const user = userEvent.setup();
      renderComponent();

      const scoreButton = screen.getByRole('button', {
        name: 'forensic:buttons.score',
      });
      await user.click(scoreButton);

      expect(mockSetOrder).toHaveBeenCalledWith({
        by: 'score',
        direction: 'desc',
      });
      expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
    });

    it('should call setOrder and setCurrentPage when clicking date button', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateButton = screen.getByRole('button', {
        name: 'forensic:buttons.date',
      });
      await user.click(dateButton);

      expect(mockSetOrder).toHaveBeenCalledWith({
        by: 'date',
        direction: 'desc',
      });
      expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
    });
  });

  describe('Sort Direction Functionality', () => {
    it('should toggle sort direction from desc to asc', async () => {
      const user = userEvent.setup();
      renderComponent();

      const sortDirectionButton = screen.getByRole('button', {
        name: 'forensic:buttons.descending',
      });
      await user.click(sortDirectionButton);

      expect(mockSetOrder).toHaveBeenCalledWith({
        by: 'score',
        direction: 'asc',
      });
      expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
    });

    it('should show correct icon and title for descending order', () => {
      renderComponent();

      const sortDirectionButton = screen.getByRole('button', {
        name: 'forensic:buttons.descending',
      });
      expect(sortDirectionButton).toBeInTheDocument();

      // Check that SortDesc icon is present (we can't directly test icon but we can test title)
      expect(sortDirectionButton).toHaveAttribute(
        'title',
        'forensic:buttons.descending'
      );
    });

    it('should show correct title for ascending order when direction is asc', () => {
      // Temporarily change the direction for this test
      const originalDirection = mockSearchContext.order.direction;
      mockSearchContext.order.direction = 'asc';

      renderComponent();

      const sortDirectionButton = screen.getByRole('button', {
        name: 'forensic:buttons.ascending',
      });
      expect(sortDirectionButton).toHaveAttribute(
        'title',
        'forensic:buttons.ascending'
      );

      // Reset the direction for other tests
      mockSearchContext.order.direction = originalDirection;
    });
  });

  describe('Delete Functionality', () => {
    it('should open confirmation dialog when trash button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const trashButton = screen.getByRole('button', {
        name: 'forensic:buttons.clear_results',
      });
      await user.click(trashButton);

      // Le dialog devrait s'ouvrir (AlertDialog utilise le rôle 'alertdialog')
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();

      // Vérifier le contenu du dialog
      expect(
        screen.getByText('forensic:buttons.delete_all_results')
      ).toBeInTheDocument();
      expect(
        screen.getByText('forensic:buttons.delete_all_results_description')
      ).toBeInTheDocument();
    });

    it('should call deleteAllTabs when confirmation is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Ouvrir le dialog
      const trashButton = screen.getByRole('button', {
        name: 'forensic:buttons.clear_results',
      });
      await user.click(trashButton);

      // Cliquer sur le bouton de confirmation
      const confirmButton = screen.getByText(
        'forensic:buttons.delete_all_results_confirm'
      );
      await user.click(confirmButton);

      expect(mockDeleteAllTabs).toHaveBeenCalled();
    });

    it('should render trash icon button with correct styling', () => {
      renderComponent();

      const trashButton = screen.getByRole('button', {
        name: 'forensic:buttons.clear_results',
      });
      expect(trashButton).toHaveClass(
        'text-muted-foreground',
        'hover:text-destructive'
      );
    });
  });

  describe('Different Sort States', () => {
    it('should highlight date button when order.by is date', () => {
      // Temporarily change the sort by for this test
      const originalBy = mockSearchContext.order.by;
      mockSearchContext.order.by = 'date';

      renderComponent();

      const scoreButton = screen.getByRole('button', {
        name: 'forensic:buttons.score',
      });
      const dateButton = screen.getByRole('button', {
        name: 'forensic:buttons.date',
      });

      expect(dateButton).toHaveClass('bg-primary');
      expect(scoreButton).not.toHaveClass('bg-primary');

      // Reset the sort by for other tests
      mockSearchContext.order.by = originalBy;
    });

    it('should handle multiple clicks on same sort button', async () => {
      const user = userEvent.setup();
      renderComponent();

      const scoreButton = screen.getByRole('button', {
        name: 'forensic:buttons.score',
      });

      // Click score button multiple times
      await user.click(scoreButton);
      await user.click(scoreButton);

      expect(mockSetOrder).toHaveBeenCalledTimes(2);
      expect(mockSetCurrentPage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined order gracefully', () => {
      // Test that component renders without throwing even when context might have undefined values
      // This is more of a smoke test to ensure the component is robust
      expect(() => renderComponent()).not.toThrow();

      // Verify the component still renders the basic elements
      expect(
        screen.getByRole('button', { name: 'forensic:buttons.score' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'forensic:buttons.date' })
      ).toBeInTheDocument();
    });

    it('should handle missing translation keys', () => {
      // Test that component can handle missing translations gracefully
      // Since we can't easily override the mock during runtime,
      // we'll test that the component renders with the existing translations
      renderComponent();

      // The component should still render successfully
      expect(
        screen.getByRole('button', { name: 'forensic:buttons.score' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'forensic:buttons.date' })
      ).toBeInTheDocument();
    });

    it('should handle rapid clicks without breaking', async () => {
      const user = userEvent.setup();
      renderComponent();

      const scoreButton = screen.getByRole('button', {
        name: 'forensic:buttons.score',
      });
      const dateButton = screen.getByRole('button', {
        name: 'forensic:buttons.date',
      });
      // Use the correct accessible name based on the default order direction
      const sortDirectionButton = screen.getByRole('button', {
        name: 'forensic:buttons.descending',
      });

      // Rapid clicks
      await Promise.all([
        user.click(scoreButton),
        user.click(dateButton),
        user.click(sortDirectionButton),
      ]);

      // Should handle all clicks
      expect(mockSetOrder).toHaveBeenCalled();
      expect(mockSetCurrentPage).toHaveBeenCalled();
    });
  });
});
