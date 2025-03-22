import { Eye, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import SearchInput from '@/components/search-input';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { FormMessage } from '@/components/ui/form.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useAuth } from '@/providers/auth-context.tsx';

import useSources from '../../hooks/use-sources.tsx';
import { ForensicFormValues } from '../../lib/types.ts';

interface SourcesProps {
  useScrollArea?: boolean;
  onSelectedCamerasChange?: (selectedCameras: string[]) => void;
}

export default function Sources({
  useScrollArea = false,
  onSelectedCamerasChange,
}: SourcesProps) {
  const { sessionId = '' } = useAuth();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add the form context
  const formContext = useFormContext<ForensicFormValues>();
  const sourcesError = formContext.formState.errors.sources?.message;
  const hasError = !!sourcesError;

  // Get current sources from form
  const formSources = formContext.watch('sources');

  const {
    cameras,
    isLoading,
    selectedCameras,
    setSelectedCameras,
    snapshots,
    snapshotLoadingStates,
  } = useSources(sessionId, undefined, formSources);

  // Sync form sources with selectedCameras when component mounts or form sources change
  useEffect(() => {
    if (
      formSources &&
      formSources.length > 0 &&
      JSON.stringify(formSources) !== JSON.stringify(selectedCameras)
    ) {
      setSelectedCameras(formSources);
    }
  }, [formSources, selectedCameras, setSelectedCameras]);

  // Filter cameras based on search term
  const filteredCameras = cameras.filter((camera) =>
    camera.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update both local state and form context
  const updateSelectedCameras = (newCameras: string[]) => {
    setSelectedCameras(newCameras);
    // Update form context with the selected cameras
    formContext.setValue('sources', newCameras, {
      shouldValidate: true,
    });

    if (onSelectedCamerasChange) {
      onSelectedCamerasChange(newCameras);
    }
  };

  const toggleAllCameras = (checked: boolean) => {
    const newSelected = checked ? filteredCameras.map((cam) => cam.id) : [];
    updateSelectedCameras(newSelected);
  };

  const handlePopoverOpenChange = (open: boolean, cameraId: string) => {
    if (open) {
      setOpenPopoverId(cameraId);
    } else {
      setOpenPopoverId(null);
    }
  };

  const renderCameraIcon = (cameraId: string) => {
    const isLoadingThisCamera = snapshotLoadingStates[cameraId];

    if (isLoadingThisCamera) {
      return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
    return <Eye className="h-4 w-4 text-muted-foreground" />;
  };

  const renderSnapshotContent = (cameraId: string, cameraName: string) => {
    if (snapshotLoadingStates[cameraId]) {
      return (
        <div className="h-[150px] w-[200px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (snapshots[cameraId]) {
      return (
        <img
          src={snapshots[cameraId] || ''}
          alt={cameraName}
          className="h-auto w-[200px] object-cover"
        />
      );
    }

    return (
      <div className="h-[150px] w-[200px] flex items-center justify-center text-sm text-muted-foreground">
        Aucun aperçu disponible
      </div>
    );
  };

  const content = (
    <div className="space-y-4">
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Rechercher une caméra..."
        className="w-full mb-2"
      />

      {filteredCameras.length > 0 && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={
              selectedCameras.length >= filteredCameras.length &&
              filteredCameras.length > 0
            }
            onCheckedChange={toggleAllCameras}
          />
          <Label htmlFor="select-all" className="text-sm font-medium">
            Sélectionner tout
          </Label>
        </div>
      )}
      <div className="space-y-2">
        {isLoading && (
          <>
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={`loading-skeleton-${skeleton}`}
                className="flex items-center space-x-2"
              >
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </>
        )}

        {!isLoading &&
          filteredCameras.map((camera) => (
            <div key={camera.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`camera-${camera.id}`}
                  checked={selectedCameras.includes(camera.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateSelectedCameras([...selectedCameras, camera.id]);
                    } else {
                      updateSelectedCameras(
                        selectedCameras.filter((id) => id !== camera.id)
                      );
                    }
                  }}
                />
                <Label
                  htmlFor={`camera-${camera.id}`}
                  className="text-sm font-medium"
                >
                  {camera.name}
                </Label>
              </div>

              <Popover
                open={openPopoverId === camera.id}
                onOpenChange={(open) =>
                  handlePopoverOpenChange(open, camera.id)
                }
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="p-1 hover:bg-muted rounded-sm relative"
                    aria-label="Afficher l'aperçu"
                  >
                    {renderCameraIcon(camera.id)}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  {renderSnapshotContent(camera.id, camera.name)}
                </PopoverContent>
              </Popover>
            </div>
          ))}

        {!isLoading && filteredCameras.length === 0 && (
          <div className="text-sm text-muted-foreground py-2">
            Aucunes caméras trouvées
          </div>
        )}
      </div>

      {sourcesError && (
        <FormMessage className="mt-2">
          {typeof sourcesError === 'string'
            ? sourcesError
            : 'Veuillez sélectionner au moins une source vidéo'}
        </FormMessage>
      )}
    </div>
  );

  return (
    <AccordionItem value="sources">
      <AccordionTrigger
        className={hasError ? 'text-destructive font-medium' : ''}
      >
        Sources vidéo
      </AccordionTrigger>
      <AccordionContent>
        {useScrollArea ? (
          <ScrollArea
            className="pr-4 rounded-sm"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            {content}
          </ScrollArea>
        ) : (
          content
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
