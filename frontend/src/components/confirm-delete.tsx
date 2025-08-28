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
  title,
  description,
  cancelText,
  confirmText,
}: DeleteConfirmationProps) {
  const defaultValues = {
    title: title || 'Confirmer la suppression',
    description:
      description ||
      'Cette action est irréversible. Voulez-vous vraiment continuer ?',
    cancelText: cancelText || 'Annuler',
    confirmText: confirmText || 'Supprimer',
  };

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
          <AlertDialogTitle>{defaultValues.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {defaultValues.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{defaultValues.cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90"
          >
            {defaultValues.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
