import { useState } from 'react';
import { Save, FileDown, FileUp } from 'lucide-react';
import { useAuth } from '@/providers/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CreateBackupWizard from '@/features/maintenance/components/backup/create';
import RestoreBackupWizard from '@/features/maintenance/components/backup/restore';
import RebootStatus from '@/components/reboot-status';

interface BackupRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'backup' | 'restore';
  sessionId: string | undefined;
}

function BackupRestoreDialog({
  open,
  onOpenChange,
  type,
  sessionId,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {type === 'backup' ? 'Create Backup' : 'Restore Backup'}
          </DialogTitle>
        </DialogHeader>
        {type === 'backup' ? (
          <CreateBackupWizard sessionId={sessionId} />
        ) : (
          <RestoreBackupWizard
            sessionId={sessionId}
            onClose={handleWizardClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateRestoreBackup() {
  const { sessionId } = useAuth();
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
        <CardContent>
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
            className="w-full mt-2"
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
        sessionId={sessionId}
      />
    </>
  );
}

export default CreateRestoreBackup;
