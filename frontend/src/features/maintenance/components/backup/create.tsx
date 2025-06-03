import { Download } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

import useLocalStorage from '@/hooks/use-localstorage';
import { useBackup } from '../../hooks/use-backup';

const getStepDescription = (step: number) => {
  switch (step) {
    case 1:
      return 'Select Content';
    case 2:
      return 'Generate Backup';
    default:
      return '';
  }
};

export default function CreateBackupWizard() {
  // Use local storage for last backup GUID
  const { setValue: setLastBackupGuid } = useLocalStorage<string | null>(
    'lastBackupGuid',
    null
  );

  // Use backup hook - le hook récupère maintenant le sessionId depuis useAuth
  const { streams, isLoading, error, generateBackup } = useBackup();

  // State management
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStreams, setSelectedStreams] = useState<Set<string>>(
    new Set()
  );
  const [includeGlobalConfig, setIncludeGlobalConfig] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize selected streams when streams are loaded
  useEffect(() => {
    if (streams.length > 0) {
      setSelectedStreams(new Set(streams.map((stream) => stream.id)));
    }
  }, [streams]);

  // Filter streams based on search query
  const filteredStreams = streams.filter((stream) =>
    stream.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle stream selection
  const toggleStream = (streamId: string) => {
    setSelectedStreams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(streamId)) newSet.delete(streamId);
      else newSet.add(streamId);
      return newSet;
    });
  };

  // Select all streams (filtered or all if no filter)
  const selectAllStreams = () => {
    const streamsToSelect = searchQuery
      ? filteredStreams.map((stream) => stream.id)
      : streams.map((stream) => stream.id);
    setSelectedStreams(new Set([...selectedStreams, ...streamsToSelect]));
  };

  // Deselect all streams (filtered or all if no filter)
  const deselectAllStreams = () => {
    if (!searchQuery) {
      setSelectedStreams(new Set());
      return;
    }

    const newSelected = new Set(selectedStreams);
    filteredStreams.forEach((stream) => {
      newSelected.delete(stream.id);
    });
    setSelectedStreams(newSelected);
  };

  // Navigation
  const handleNext = () => {
    if (step < 2) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Generate backup - adaptation pour le nouveau hook
  const handleGenerateBackup = async () => {
    try {
      setIsGenerating(true);

      // Appel à generateBackup avec le format attendu par le hook mis à jour
      const backupGuid = await generateBackup({
        global: includeGlobalConfig,
        selectedStreams: Array.from(selectedStreams),
      });

      if (backupGuid) {
        setLastBackupGuid(backupGuid);
      }
    } catch {
      // console.error('Failed to generate backup:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div>Loading streams...</div>;
  }

  if (error) {
    return <div>Error: {JSON.stringify(error)}</div>;
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Create Backup</CardTitle>
        <CardDescription>
          Step {step} of 2: {getStepDescription(step)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
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

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search streams..."
              />

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
                        className="form-checkbox size-4"
                      />
                      <label
                        htmlFor={`stream-${stream.id}`}
                        className="cursor-pointer grow"
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

        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
              <div className="space-y-3">
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
                <ScrollArea className="h-[200px] w-full rounded-md border">
                  <div className="p-4 space-y-2">
                    {Array.from(selectedStreams).map((streamId) => {
                      const stream = streams.find((s) => s.id === streamId);
                      if (!stream) return null;
                      return (
                        <div key={streamId} className="text-sm">
                          {stream.name}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleGenerateBackup}
                disabled={isGenerating || selectedStreams.size === 0}
                className="gap-2"
              >
                <Download className="size-4" />
                {isGenerating ? 'Generating...' : 'Download Backup'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between mt-4">
        <Button variant="outline" onClick={handleBack} disabled={step === 1}>
          Back
        </Button>
        {step < 2 && (
          <Button onClick={handleNext} disabled={selectedStreams.size === 0}>
            Next
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
