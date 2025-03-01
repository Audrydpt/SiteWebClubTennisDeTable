import { AlertCircle, Loader2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import SearchInput from '@/components/search-input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useRestore } from '../../hooks/use-restore';

interface RestoreBackupWizardProps {
  onClose: (skipRebootDialog: boolean) => void;
}

const getStepDescription = (step: number) => {
  switch (step) {
    case 1:
      return 'Upload Backup File';
    case 2:
      return 'Select Backup Streams';
    case 3:
      return 'Map Streams';
    case 4:
      return 'Finalize & Restore';
    default:
      return '';
  }
};

export default function RestoreBackupWizard({
  onClose,
}: RestoreBackupWizardProps) {
  const {
    uploadBackup,
    restoreBackup,
    reboot,
    streams,
    isLoading,
    restorePoint,
    error: hookError,
    lastBackupGuid, // Now we get this from the hook
  } = useRestore();

  // Local states for wizard control
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [selectedBackupStreams, setSelectedBackupStreams] = useState<
    Set<string>
  >(new Set());
  const [useLastBackup, setUseLastBackup] = useState(false);

  // Configuration states
  const [globalParams, setGlobalParams] = useState(false);
  const [streamMappings, setStreamMappings] = useState<Record<string, string>>(
    {}
  );
  const [restoreDisabled, setRestoreDisabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rebootChoice, setRebootChoice] = useState<'now' | 'later'>('now');

  // Auto-select all streams when restorePoint is updated
  useEffect(() => {
    if (restorePoint && Object.keys(restorePoint.streamData).length > 0) {
      const allStreamIds = Object.keys(restorePoint.streamData);
      setSelectedBackupStreams(new Set(allStreamIds));
    }
  }, [restorePoint]);

  // Update restore button state based on selections
  useEffect(() => {
    setRestoreDisabled(
      !globalParams && Object.keys(streamMappings).length === 0
    );
  }, [globalParams, streamMappings]);

  // Disable global params if not a unit backup
  useEffect(() => {
    if (restorePoint && !restorePoint.unit) {
      setGlobalParams(false);
    }
  }, [restorePoint]);

  // Filter backup streams based on search
  const filteredBackupStreams = Object.entries(
    restorePoint?.streamData || {}
  ).filter(([, name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Select all filtered streams
  const selectFilteredStreams = () => {
    const newSelected = new Set(selectedBackupStreams);
    filteredBackupStreams.forEach(([streamId]) => {
      newSelected.add(streamId);
    });
    setSelectedBackupStreams(newSelected);
  };

  // Clear all filtered streams
  const clearFilteredStreams = () => {
    const updatedSelected = new Set(selectedBackupStreams);
    filteredBackupStreams.forEach(([streamId]) => {
      updatedSelected.delete(streamId);
    });
    setSelectedBackupStreams(updatedSelected);
  };

  // Toggle a single backup stream
  const toggleBackupStream = (streamId: string) => {
    const newSelected = new Set(selectedBackupStreams);
    if (newSelected.has(streamId)) {
      newSelected.delete(streamId);
    } else {
      newSelected.add(streamId);
    }
    setSelectedBackupStreams(newSelected);
  };

  // Handle stream mapping change
  const handleMappingChange = (
    serverStreamId: string,
    backupStreamId: string | null
  ) => {
    setStreamMappings((prev) => {
      const newMappings = { ...prev };
      if (backupStreamId === null) {
        delete newMappings[serverStreamId];
      } else {
        newMappings[serverStreamId] = backupStreamId;
      }
      return newMappings;
    });
  };
  const assignDefaultMappings = () => {
    const newMappings = { ...streamMappings };

    streams.forEach((serverStream) => {
      if (selectedBackupStreams.has(serverStream.id)) {
        newMappings[serverStream.id] = serverStream.id;
      }
    });

    setStreamMappings(newMappings);
  };
  const resetAllMappings = () => {
    setStreamMappings({});
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !selectedFile.name.endsWith('.mvb')) return;

    setFile(selectedFile);
    try {
      await uploadBackup(selectedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload error');
    }
  };

  // Handle restore process
  const handleRestore = async () => {
    if (!restorePoint) return;

    const streamMappingArray = Object.entries(streamMappings).map(
      ([serverStreamId, backupStreamId]) => ({
        from: backupStreamId,
        to: serverStreamId,
      })
    );

    try {
      await restoreBackup({
        restorePointId: restorePoint.id,
        streams: streamMappingArray,
        global: globalParams,
      });
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore error');
    }
  };

  // Check if step 1 is ready to proceed
  const isStep1Ready =
    (!isLoading && useLastBackup && restorePoint) ||
    (!useLastBackup && file && restorePoint);

  // Render the content based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {lastBackupGuid && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Use Last Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      A backup is available in your browser storage
                    </p>
                  </div>
                  <Switch
                    checked={useLastBackup}
                    onCheckedChange={setUseLastBackup}
                  />
                </div>
                {useLastBackup && restorePoint && (
                  <div className="mt-4">
                    <Label>Backup Preview:</Label>
                    <p className="text-sm">Date: {restorePoint.date}</p>
                    <p className="text-sm">
                      Streams: {Object.keys(restorePoint.streamData).length}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!useLastBackup && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto mb-4" />
                <Input
                  id="backup-file"
                  type="file"
                  accept=".mvb"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <Button
                  onClick={() =>
                    document.getElementById('backup-file')?.click()
                  }
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'Select Backup File'
                  )}
                </Button>
                {file && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected file: {file.name}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          restorePoint && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search streams..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectFilteredStreams}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilteredStreams}
                >
                  Clear
                </Button>
              </div>
              <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-4 space-y-2">
                  {(() => {
                    const filteredEntries = Object.entries(
                      restorePoint.streamData
                    ).filter(
                      ([streamId, name]) =>
                        `Stream ${streamId}`
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        name.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    return filteredEntries.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        No streams found
                      </div>
                    ) : (
                      filteredEntries.map(([streamId, name]) => (
                        <div
                          key={streamId}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                        >
                          <input
                            type="checkbox"
                            id={`stream-${streamId}`}
                            checked={selectedBackupStreams.has(streamId)}
                            onChange={() => toggleBackupStream(streamId)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`stream-${streamId}`}>
                            Stream {streamId} [{name}]
                          </Label>
                        </div>
                      ))
                    );
                  })()}
                </div>
              </ScrollArea>
            </div>
          )
        );

      case 3:
        return (
          <ScrollArea className="h-[400px] border rounded-md">
            <div className="space-y-6 p-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="space-y-0.5">
                  <Label htmlFor="global-params">
                    Restore global parameters
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {restorePoint?.unit
                      ? 'Apply global settings from backup'
                      : 'No global configuration available in backup'}
                  </p>
                </div>
                <Switch
                  id="global-params"
                  checked={globalParams}
                  onCheckedChange={setGlobalParams}
                  disabled={!restorePoint?.unit}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search streams..."
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={assignDefaultMappings}
                  >
                    Auto-Map Same IDs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAllMappings}
                  >
                    Reset All
                  </Button>
                </div>
                {streams
                  .filter((stream) =>
                    stream.id.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((serverStream) => (
                    <div
                      key={serverStream.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <span className="font-medium">
                        Stream {serverStream.id} (ID: {serverStream.id})
                      </span>
                      <Select
                        value={streamMappings[serverStream.id] || 'keep'}
                        onValueChange={(value) =>
                          handleMappingChange(
                            serverStream.id,
                            value === 'keep' ? null : value
                          )
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Keep current stream" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keep">
                            Keep current stream
                          </SelectItem>
                          {Array.from(selectedBackupStreams).map(
                            (backupStreamId) => (
                              <SelectItem
                                key={backupStreamId}
                                value={backupStreamId}
                              >
                                {restorePoint?.streamData[backupStreamId]} (ID:{' '}
                                {backupStreamId})
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                {streams.filter((stream) =>
                  stream.id.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No streams found
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg font-medium">Restore complete!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose when to apply the changes
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="reboot-now"
                  name="reboot"
                  className="h-4 w-4"
                  value="now"
                  checked={rebootChoice === 'now'}
                  onChange={(e) => {
                    setRebootChoice(e.target.value as 'now' | 'later');
                  }}
                />
                <Label htmlFor="reboot-now">Reboot Now</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="reboot-later"
                  name="reboot"
                  className="h-4 w-4"
                  value="later"
                  checked={rebootChoice === 'later'}
                  onChange={(e) => {
                    setRebootChoice(e.target.value as 'now' | 'later');
                  }}
                />
                <Label htmlFor="reboot-later">Reboot Manually</Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Restore Backup</CardTitle>
        <CardDescription>
          Step {step} of 4: {getStepDescription(step)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {(error || hookError) && (
          <div className="text-destructive bg-muted rounded flex items-center p-3 mb-4">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error || hookError}
          </div>
        )}
        {renderStepContent()}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          disabled={step === 1}
        >
          Back
        </Button>
        {step === 4 ? (
          <Button
            onClick={() => {
              if (rebootChoice === 'now') {
                reboot()
                  .then(() => {
                    onClose(false);
                  })
                  .catch((err) => {
                    setError(
                      err instanceof Error ? err.message : 'Reboot error'
                    );
                  });
              } else {
                onClose(true);
              }
            }}
            disabled={isLoading}
          >
            {isLoading && rebootChoice === 'now' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rebooting...
              </>
            ) : (
              'Apply'
            )}
          </Button>
        ) : (
          <Button
            onClick={() => (step === 3 ? handleRestore() : setStep(step + 1))}
            disabled={
              (step === 1 && !isStep1Ready) ||
              (step === 2 && selectedBackupStreams.size === 0) ||
              (step === 3 && restoreDisabled) ||
              isLoading
            }
          >
            {(() => {
              if (step === 3) {
                if (isLoading) {
                  return (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Restoring...
                    </>
                  );
                }
                return 'Restore';
              }
              return 'Next';
            })()}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
