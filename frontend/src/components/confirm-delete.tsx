import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const defaultValues = {
    title: title || t('deleteConfirmation.title'),
    description: description || t('deleteConfirmation.description'),
    cancelText: cancelText || t('cancel'),
    confirmText: confirmText || t('delete'),
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
            className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
          >
            {defaultValues.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
