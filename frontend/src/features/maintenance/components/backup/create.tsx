'use client';

import { useState } from 'react';
import { Download, Search } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';

interface Stream {
  id: string;
  name: string;
}

const mockStreams: Stream[] = Array.from({ length: 150 }, (_, i) => ({
  id: `stream-${i + 1}`,
  name: `Stream ${i + 1}`,
}));

const getStepDescription = (step: number) => {
  switch (step) {
    case 1:
      return 'Backup Name';
    case 2:
      return 'Select Content';
    case 3:
      return 'Configure Streams';
    case 4:
      return 'Generate Backup';
    default:
      return '';
  }
};

export default function CreateBackupWizard() {
  const [step, setStep] = useState(1);
  const [backupName, setBackupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStreams, setSelectedStreams] = useState<Set<string>>(
    new Set()
  );
  const [includeGlobalConfig, setIncludeGlobalConfig] = useState(true);
  const [streamRenames, setStreamRenames] = useState<Record<string, string>>(
    {}
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredStreams = mockStreams.filter((stream) =>
    stream.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStream = (streamId: string) => {
    const newSelected = new Set(selectedStreams);
    if (newSelected.has(streamId)) {
      newSelected.delete(streamId);
      const { [streamId]: removed, ...rest } = streamRenames;
      setStreamRenames(rest);
    } else {
      newSelected.add(streamId);
    }
    setSelectedStreams(newSelected);
  };

  const selectAllStreams = () => {
    setSelectedStreams(new Set(mockStreams.map((stream) => stream.id)));
  };

  const deselectAllStreams = () => {
    setSelectedStreams(new Set());
    setStreamRenames({});
  };

  const handleNext = () => {
    if (step === 1 && !backupName.trim()) {
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerateBackup = async () => {
    setIsGenerating(true);
    try {
      const backupData = {
        name: backupName,
        timestamp: new Date().toISOString(),
        includeGlobalConfig,
        streams: Array.from(selectedStreams).map((streamId) => ({
          originalId: streamId,
          originalName: mockStreams.find((s) => s.id === streamId)?.name,
          newName:
            streamRenames[streamId] ||
            mockStreams.find((s) => s.id === streamId)?.name,
        })),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backupName.replace(/\s+/g, '_')}_${new Date().toISOString()}.backup`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Create Backup</CardTitle>
        <CardDescription>
          Step {step} of 4: {getStepDescription(step)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="backup-name">Backup Name</Label>
              <Input
                id="backup-name"
                placeholder="Enter backup name..."
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Switch
                id="global-config"
                checked={includeGlobalConfig}
                onCheckedChange={setIncludeGlobalConfig}
              />
              <Label htmlFor="global-config">
                Include Global Configuration
              </Label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Streams</Label>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllStreams}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllStreams}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search streams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-4 space-y-2">
                  {filteredStreams.map((stream) => (
                    <div
                      key={stream.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                    >
                      <input
                        id={`stream-${stream.id}`}
                        type="checkbox"
                        checked={selectedStreams.has(stream.id)}
                        onChange={() => toggleStream(stream.id)}
                        className="form-checkbox h-4 w-4"
                      />
                      <label
                        htmlFor={`stream-${stream.id}`}
                        className="cursor-pointer flex-grow"
                      >
                        {stream.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-grow">
                  <Label htmlFor="global-rename">Global Stream Rename</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="global-rename"
                      placeholder="Enter name for all selected streams..."
                      className="flex-grow"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById(
                          'global-rename'
                        ) as HTMLInputElement;
                        const globalName = input.value;
                        if (globalName.trim()) {
                          const newRenames: Record<string, string> = {};
                          selectedStreams.forEach((streamId) => {
                            newRenames[streamId] = globalName;
                          });
                          setStreamRenames(newRenames);
                          input.value = '';
                        }
                      }}
                    >
                      Apply to All
                    </Button>
                  </div>
                </div>
              </div>

              <Label>Configure Individual Stream Names</Label>
              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-4 space-y-4">
                  {Array.from(selectedStreams).map((streamId) => {
                    const stream = mockStreams.find((s) => s.id === streamId);
                    if (!stream) return null;

                    return (
                      <div key={streamId} className="grid gap-2">
                        <Label htmlFor={`rename-${streamId}`}>
                          {stream.name}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id={`rename-${streamId}`}
                            placeholder="Enter new name (optional)"
                            value={streamRenames[streamId] || ''}
                            onChange={(e) => {
                              const { value } = e.target;
                              setStreamRenames((prev) => ({
                                ...prev,
                                [streamId]: value,
                              }));
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => {
                              setStreamRenames((prev) => ({
                                ...prev,
                                [streamId]: stream.name,
                              }));
                            }}
                          >
                            Use Original
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Backup Name:</span>
                  <span>{backupName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Global Configuration:</span>
                  <span>
                    {includeGlobalConfig ? 'Included' : 'Not included'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Selected Streams:</span>
                  <span>{selectedStreams.size}</span>
                </div>
              </div>

              {selectedStreams.size > 0 && (
                <div className="space-y-2">
                  <span className="font-medium">Stream Details:</span>
                  <ScrollArea className="h-[200px] w-full rounded-md border">
                    <div className="p-4 space-y-2">
                      {Array.from(selectedStreams).map((streamId) => {
                        const stream = mockStreams.find(
                          (s) => s.id === streamId
                        );
                        if (!stream) return null;

                        return (
                          <div
                            key={streamId}
                            className="flex justify-between text-sm"
                          >
                            <span>{stream.name}</span>
                            {streamRenames[streamId] && (
                              <span className="text-muted-foreground">
                                → {streamRenames[streamId]}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleGenerateBackup}
                disabled={isGenerating}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Download Backup'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 1}>
          Back
        </Button>
        {step < 4 && (
          <Button
            onClick={handleNext}
            disabled={step === 1 && !backupName.trim()}
          >
            Next
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
