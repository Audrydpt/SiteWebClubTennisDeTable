import { FileDown, FileUp, Save } from 'lucide-react';
import { useState } from 'react';

import RebootStatus from '@/components/reboot-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import CreateBackupWizard from './backup/create';
import RestoreBackupWizard from './backup/restore';

interface BackupRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'backup' | 'restore';
}

function BackupRestoreDialog({
  open,
  onOpenChange,
  type,
}: BackupRestoreDialogProps) {
  const [showRebootStatus, setShowRebootStatus] = useState(false);

  const handleClose = () => {
    setShowRebootStatus(false);
    onOpenChange(false);
  };

  const handleWizardClose = (skipRebootDialog: boolean) => {
    if (skipRebootDialog) {
      handleClose();
    } else {
      setShowRebootStatus(true);
    }
  };

  if (showRebootStatus) {
    return <RebootStatus onRebootComplete={handleClose} />;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-full sm:w-2xl sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {type === 'backup' ? 'Create Backup' : 'Restore Backup'}
          </DialogTitle>
        </DialogHeader>
        {type === 'backup' ? (
          <CreateBackupWizard />
        ) : (
          <RestoreBackupWizard onClose={handleWizardClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateRestoreBackup() {
  const [dialogType, setDialogType] = useState<'backup' | 'restore' | null>(
    null
  );

  const handleCreateBackup = () => {
    setDialogType('backup');
  };

  const handleRestoreBackup = () => {
    setDialogType('restore');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Save className="mr-2" />
            Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <Button
            variant="default"
            className="w-full"
            onClick={handleCreateBackup}
          >
            <FileUp className="mr-2" />
            Create Backup
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRestoreBackup}
          >
            <FileDown className="mr-2" />
            Restore Backup
          </Button>
        </CardContent>
      </Card>

      <BackupRestoreDialog
        open={dialogType !== null}
        onOpenChange={(open) => !open && setDialogType(null)}
        type={dialogType || 'backup'}
      />
    </>
  );
}

export default CreateRestoreBackup;
