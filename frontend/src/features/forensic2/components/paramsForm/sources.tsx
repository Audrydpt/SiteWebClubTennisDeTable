import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import SearchInput from '@/components/search-input';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';

import { useForensicForm } from '@/features/forensic/lib/provider/forensic-form-context.tsx';
import { ForensicFormValues } from '@/features/forensic/lib/types.ts';

import useSources from '../../hooks/use-sources.tsx';

interface SourcesProps {
  useScrollArea?: boolean;
  onSelectedCamerasChange?: (selectedCameras: string[]) => void;
}

export default function Sources({
  useScrollArea = false,
  onSelectedCamerasChange,
}: SourcesProps) {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Use the forensic form context instead of direct useFormContext
  const { formMethods } = useForensicForm();
  const { control, setValue } = formMethods;

  // Get current sources from form using useWatch
  const sources = useWatch<ForensicFormValues, 'sources'>({
    control,
    name: 'sources',
  });

  const { cameras, isLoading, selectedCameras, setSelectedCameras } =
    useSources(sources);

  // Sync form sources with selectedCameras when component mounts or form sources change
  useEffect(() => {
    if (
      sources &&
      sources.length > 0 &&
      JSON.stringify(sources) !== JSON.stringify(selectedCameras)
    ) {
      setSelectedCameras(sources);
    }
  }, [sources, selectedCameras, setSelectedCameras]);

  // Filter cameras based on search term
  const filteredCameras = cameras.filter((camera) =>
    camera.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update both local state and form context
  const updateSelectedCameras = (newCameras: string[]) => {
    setSelectedCameras(newCameras);
    // Update form context with the selected cameras
    setValue('sources', newCameras, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
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

  const renderCameraList = () => (
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
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <img
                    src={`${process.env.MAIN_API_URL}/vms/cameras/${camera.id}/live`}
                    alt={camera.name}
                    className="h-auto w-[200px] object-cover"
                  />
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
    </div>
  );

  return (
    <AccordionItem value="sources">
      <FormField
        control={control}
        name="sources"
        render={({ fieldState }) => (
          <>
            <AccordionTrigger
              className={fieldState.error ? 'text-destructive font-medium' : ''}
            >
              Sources vidéo
              {sources?.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({sources.length} sélectionnées)
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <FormItem>
                {useScrollArea ? (
                  <ScrollArea
                    className="pr-4 rounded-sm"
                    style={{ maxHeight: '400px', overflowY: 'auto' }}
                  >
                    {renderCameraList()}
                  </ScrollArea>
                ) : (
                  renderCameraList()
                )}
                {fieldState.error && (
                  <FormMessage>
                    Veuillez sélectionner au moins une source vidéo
                  </FormMessage>
                )}
              </FormItem>
            </AccordionContent>
          </>
        )}
      />
    </AccordionItem>
  );
}
