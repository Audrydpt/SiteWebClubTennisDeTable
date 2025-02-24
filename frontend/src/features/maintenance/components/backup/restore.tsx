import { useState } from 'react';
import { Upload, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import useRestore from '../../hooks/use-restore';

const getStepDescription = (step: number) => {
  switch (step) {
    case 1:
      return 'Upload Backup File';
    case 2:
      return 'Configure Stream Mapping';
    default:
      return '';
  }
};

export default function RestoreBackupWizard({
  sessionId,
}: {
  sessionId: string | undefined;
}) {
  const { restoreBackup, isLoading, error, restorePoint } = useRestore(
    sessionId || ''
  );
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [streamAssignments, setStreamAssignments] = useState<
    Record<string, string>
  >({});
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [isFileValid, setIsFileValid] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    console.log('Selected file:', selectedFile);

    if (!selectedFile.name.endsWith('.mvb')) {
      setIsFileValid(false);
      console.log('Invalid file extension');
      return;
    }

    setFile(selectedFile);
    setIsAnalyzingFile(true);

    try {
      const streamMappings: Array<{ from: string; to: string }> = [];
      console.log('Starting restore backup process');
      await restoreBackup({
        file: selectedFile,
        streams: streamMappings,
        global: true,
      });

      console.log('Restore backup completed, setting file as valid');
      setIsFileValid(true);
    } catch (err) {
      console.error('Error processing backup file:', err);
      setIsFileValid(false);
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const handleNext = () => {
    if (isFileValid && file && restorePoint) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setFile(null);
    setStreamAssignments({});
    setIsFileValid(false);
  };

  const handleRestore = async () => {
    if (!file) return;

    const streamMappings = Object.entries(streamAssignments)
      .filter(([, to]) => to)
      .map(([from, to]) => ({ from, to }));

    await restoreBackup({ file, streams: streamMappings, global: true });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Restore Backup</CardTitle>
        <CardDescription>
          Step {step} of 2: {getStepDescription(step)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">{error}</div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-4" />
              <Input
                id="backup-file"
                type="file"
                accept=".mvb"
                className="hidden"
                onChange={handleFileChange}
                disabled={isAnalyzingFile}
              />
              <Button
                onClick={() => document.getElementById('backup-file')?.click()}
                disabled={isAnalyzingFile}
              >
                {isAnalyzingFile ? 'Analyzing file...' : 'Select Backup File'}
              </Button>
              {file && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected file: {file.name}
                </p>
              )}
              {file && !isFileValid && (
                <p className="mt-2 text-sm text-red-500">
                  Invalid backup file format. Please select a .mvb file.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && restorePoint && (
          <div className="space-y-6">
            {/* ... other backup info ... */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Stream Mapping</Label>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-4 space-y-2">
                  {Object.entries(restorePoint.streamData).map(
                    ([streamId, name]) => (
                      <div
                        key={streamId}
                        className="flex justify-between items-center p-2 hover:bg-muted rounded"
                      >
                        <span className="font-medium">{name}</span>
                        <Input
                          className="ml-4 w-64"
                          value={streamAssignments[streamId] || ''}
                          onChange={(e) => {
                            setStreamAssignments({
                              ...streamAssignments,
                              [streamId]: e.target.value,
                            });
                          }}
                          placeholder="Enter new name"
                        />
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || isLoading}
        >
          Back
        </Button>
        {step === 1 ? (
          <Button
            onClick={handleNext}
            disabled={!isFileValid || isAnalyzingFile || !file}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleRestore}
            disabled={isLoading || Object.keys(streamAssignments).length === 0}
          >
            {isLoading ? 'Restoring...' : 'Restore Backup'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
