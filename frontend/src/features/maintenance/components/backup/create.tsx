/* eslint-disable */
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import SearchInput from '@/components/search-input';
import useLocalStorage from '@/hooks/use-localstorage';
import useBackup from '../../hooks/use-backup';

interface CreateBackupWizardProps {
  sessionId: string | undefined;
}

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

export default function CreateBackupWizard({
  sessionId,
}: CreateBackupWizardProps) {
  const { setValue: setLastBackupGuid } = useLocalStorage<string | null>(
    'lastBackupGuid',
    null
  );
  const { streams, isLoading, generateBackup } = useBackup(sessionId || '');
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStreams, setSelectedStreams] = useState<Set<string>>(
    new Set()
  );
  const [includeGlobalConfig, setIncludeGlobalConfig] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (streams.length > 0) {
      setSelectedStreams(new Set(streams.map((stream) => stream.id)));
    }
  }, [streams]);

  const filteredStreams = streams.filter((stream) =>
    stream.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStream = (streamId: string) => {
    const newSelected = new Set(selectedStreams);
    if (newSelected.has(streamId)) {
      newSelected.delete(streamId);
    } else {
      newSelected.add(streamId);
    }
    setSelectedStreams(newSelected);
  };

  const selectAllStreams = () => {
    const streamsToSelect = searchQuery
      ? filteredStreams.map((stream) => stream.id)
      : streams.map((stream) => stream.id);
    setSelectedStreams(new Set([...selectedStreams, ...streamsToSelect]));
  };

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

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerateBackup = async () => {
    setIsGenerating(true);
    try {
      const backupGuid = await generateBackup(includeGlobalConfig, [
        ...selectedStreams,
      ]);
      if (backupGuid) {
        setLastBackupGuid(backupGuid);
      }
    } catch (error) {
      console.error('Failed to generate backup:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div>Loading streams...</div>;
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
        {step < 2 && <Button onClick={handleNext}>Next</Button>}
      </CardFooter>
    </Card>
  );
}
