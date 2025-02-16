import { useState } from 'react';
import { Save, FileDown, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function CreateRestoreBackup() {
  const [backupStatus, setBackupStatus] = useState('');

  const handleCreateBackup = () => {
    setBackupStatus('Creating backup...');
    setTimeout(() => setBackupStatus('Backup created successfully!'), 2000);
  };

  const handleRestoreBackup = () => {
    setBackupStatus('Restoring backup...');
    setTimeout(() => setBackupStatus('Backup restored successfully!'), 2000);
  };

  return (
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
        {backupStatus && <p className="mt-2 text-green-600">{backupStatus}</p>}
      </CardContent>
    </Card>
  );
}

export default CreateRestoreBackup;
