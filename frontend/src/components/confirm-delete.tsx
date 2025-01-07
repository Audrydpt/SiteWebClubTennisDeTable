import { ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmationProps {
  onDelete: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
}

export default function DeleteConfirmation({
  onDelete,
  children,
  title = 'Êtes-vous sûr ?',
  description = 'Cette action est irréversible et ne pourra pas être annulée.',
  cancelText = 'Annuler',
  confirmText = 'Supprimer',
}: DeleteConfirmationProps) {
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete();
  };

  const handleTriggerClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild onClick={handleTriggerClick}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
