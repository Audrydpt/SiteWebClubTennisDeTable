/* eslint-disable */
import { useState, useEffect } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import SearchInput from '@/components/search-input';
import useRestore from '../../hooks/use-restore';
import useLocalStorage from '@/hooks/use-localstorage.tsx';
import { useQuery } from '@tanstack/react-query';

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
  sessionId,
  onClose,
}: {
  sessionId: string | undefined;
  onClose: (skipRebootDialog: boolean) => void;
}) {
  const {
    uploadBackup,
    getRestorePointInfo,
    restoreBackup,
    reboot,
    isLoading,
    error,
    restorePoint,
    serverStreams,
  } = useRestore(sessionId || '');

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [selectedBackupStreams, setSelectedBackupStreams] = useState<
    Set<string>
  >(new Set());
  const { value: lastBackupGuid } = useLocalStorage<string | null>(
    'lastBackupGuid',
    null
  );
  const [useLastBackup, setUseLastBackup] = useState(false);

  const lastBackupRestorePointQuery = useQuery({
    queryKey: ['restorePointInfo', lastBackupGuid],
    queryFn: async () => {
      if (!lastBackupGuid) return null;
      await getRestorePointInfo(lastBackupGuid);
      return true;
    },
    enabled: useLastBackup && !!lastBackupGuid,
  });

  useEffect(() => {
    if (lastBackupRestorePointQuery.isError) {
      console.error('Failed to fetch restore point info', lastBackupRestorePointQuery.error);
    }
  }, [lastBackupRestorePointQuery.isError, lastBackupRestorePointQuery.error]);

  useEffect(() => {
    if (restorePoint && Object.keys(restorePoint.streamData).length > 0) {
      const allStreamIds = Object.keys(restorePoint.streamData);
      setSelectedBackupStreams(new Set(allStreamIds));
    }
  }, [restorePoint]);

  const [streamMappings, setStreamMappings] = useState<Record<string, string>>(
    {}
  );
  const [restoreDisabled, setRestoreDisabled] = useState(true);
  const [globalParams, setGlobalParams] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [rebootChoice, setRebootChoice] = useState<'now' | 'later'>('now');

  const filteredBackupStreams = restorePoint
    ? Object.entries(restorePoint.streamData).filter(([, name]) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const selectFilteredStreams = () => {
    const newSelected = new Set(selectedBackupStreams);
    filteredBackupStreams.forEach(([streamId]) => {
      newSelected.add(streamId);
    });
    setSelectedBackupStreams(newSelected);
  };

  const clearFilteredStreams = () => {
    const updatedSelected = new Set(selectedBackupStreams);
    filteredBackupStreams.forEach(([streamId]) => {
      updatedSelected.delete(streamId);
    });
    setSelectedBackupStreams(updatedSelected);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !selectedFile.name.endsWith('.mvb')) return;

    setFile(selectedFile);
    try {
      const restorePointId = await uploadBackup(selectedFile);
      await getRestorePointInfo(restorePointId);
    } catch {
      console.error('Failed to upload backup');
    }
  };

  const toggleBackupStream = (streamId: string) => {
    const newSelected = new Set(selectedBackupStreams);
    if (newSelected.has(streamId)) {
      newSelected.delete(streamId);
    } else {
      newSelected.add(streamId);
    }
    setSelectedBackupStreams(newSelected);
  };

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
      setRestoreDisabled(!globalParams && Object.keys(newMappings).length === 0);
      return newMappings;
    });
  };

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
        file: file!,
        streams: streamMappingArray,
        global: globalParams,
      });
      setStep(4);
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  };

  const isStep1Ready = !isLoading && (
      (useLastBackup && restorePoint) ||
      (!useLastBackup && file && restorePoint)
  );
  useEffect(() => {
    setRestoreDisabled(!globalParams && Object.keys(streamMappings).length === 0);
  }, [globalParams, streamMappings]);

  useEffect(() => {
    if (restorePoint && !restorePoint.unit) {
      setGlobalParams(false);
    }
  }, [restorePoint]);

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
                    onCheckedChange={(checked) => {
                      setUseLastBackup(checked);
                      if (!checked) {
                        setFile(null);
                      }
                    }}
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
                      ? "Apply global settings from backup"
                      : "No global configuration available in backup"}
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
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search streams..."
                />
                {serverStreams
                  .filter((stream) =>
                    stream.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                  .map((serverStream) => (
                    <div
                      key={serverStream.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <span className="font-medium">
                        {serverStream.name} (ID: {serverStream.id})
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
                {serverStreams.filter((stream) =>
                  stream.name.toLowerCase().includes(searchQuery.toLowerCase())
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
                    console.log("Radio changed to:", e.target.value);
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
                    console.log("Radio changed to:", e.target.value);
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
        {error && (
          <div className="text-destructive bg-muted rounded flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
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
              console.log("Apply clicked, rebootChoice:", rebootChoice);
              if (rebootChoice === 'now') {
                console.log("User selected 'Reboot Now'. Calling reboot()...");
                reboot()
                  .then(() => {
                    onClose(false);
                  })
                  .catch((err) => {
                    console.error("Error during reboot:", err);
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
              (step === 3 && restoreDisabled)
            }
          >
            {step === 3 ? (
              isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                'Restore'
              )
            ) : (
              'Next'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
