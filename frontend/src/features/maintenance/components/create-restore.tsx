'use client';

import { useState } from 'react';
import { Save, FileDown, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CreateBackupWizard from '@/features/maintenance/components/backup/create';

function CreateRestoreBackup() {
  const [backupStatus, setBackupStatus] = useState('');
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  const handleCreateBackup = () => {
    setShowBackupDialog(true);
  };

  const handleRestoreBackup = () => {
    setBackupStatus('Restoring backup...');
    setTimeout(() => setBackupStatus('Backup restored successfully!'), 2000);
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
          {backupStatus && (
            <p className="mt-2 text-green-600">{backupStatus}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
          </DialogHeader>
          <CreateBackupWizard />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CreateRestoreBackup;
