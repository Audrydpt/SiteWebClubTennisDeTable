import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';
import DeleteConfirmation from './confirm-delete';

describe('DeleteConfirmation', () => {
  const setup = (props = {}) =>
    render(
      <DeleteConfirmation onDelete={() => {}} {...props}>
        <Button>Delete</Button>
      </DeleteConfirmation>
    );

  it('renders with default props', async () => {
    setup();

    fireEvent.click(screen.getByText('Delete'));

    expect(await screen.findByText('Êtes-vous sûr ?')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Cette action est irréversible et ne pourra pas être annulée.'
      )
    ).toBeInTheDocument();
    expect(await screen.findByText('Annuler')).toBeInTheDocument();
    expect(await screen.findByText('Supprimer')).toBeInTheDocument();
  });

  it('renders with custom props', async () => {
    setup({
      title: 'Custom Title',
      description: 'Custom Description',
      cancelText: 'Cancel Custom',
      confirmText: 'Confirm Custom',
    });

    fireEvent.click(screen.getByText('Delete'));

    expect(await screen.findByText('Custom Title')).toBeInTheDocument();
    expect(await screen.findByText('Custom Description')).toBeInTheDocument();
    expect(await screen.findByText('Cancel Custom')).toBeInTheDocument();
    expect(await screen.findByText('Confirm Custom')).toBeInTheDocument();
  });

  it('calls onDelete when confirm button is clicked', async () => {
    const handleDelete = vi.fn();
    setup({ onDelete: handleDelete });

    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(await screen.findByText('Supprimer'));

    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('does not call onDelete when cancel button is clicked', async () => {
    const handleDelete = vi.fn();
    setup({ onDelete: handleDelete });

    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(await screen.findByText('Annuler'));

    expect(handleDelete).not.toHaveBeenCalled();
  });
});
