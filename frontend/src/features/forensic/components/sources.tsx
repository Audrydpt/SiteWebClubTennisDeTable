/* eslint-disable */
import { useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import useSources from '../hooks/use-sources';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-context';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface SourcesProps {
  useScrollArea?: boolean;
  maxHeight?: string;
  onSelectedCamerasChange?: (selectedCameras: string[]) => void;
}

export default function Sources({
  useScrollArea = false,
  maxHeight = '300px',
  onSelectedCamerasChange,
}: SourcesProps) {
  const { sessionId = '' } = useAuth();
  const [loadingSnapshots, setLoadingSnapshots] = useState<
    Record<string, boolean>
  >({});
  const [cameraSnapshots, setCameraSnapshots] = useState<
    Record<string, string | null>
  >({});
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const { cameras, isLoading, selectedCameras, setSelectedCameras } =
    useSources(sessionId);

  // Update parent component when selected cameras change
  const updateSelectedCameras = (newCameras: string[]) => {
    setSelectedCameras(newCameras);
    if (onSelectedCamerasChange) {
      onSelectedCamerasChange(newCameras);
    }
  };

  const toggleAllCameras = (checked: boolean) => {
    const newSelected = checked ? cameras.map((cam) => cam.id) : [];
    updateSelectedCameras(newSelected);
  };

  const loadSnapshot = async (camera: { id: string; source: string }) => {
    if (loadingSnapshots[camera.id]) {
      return;
    }

    // Reset the snapshot if we're loading it again
    if (openPopoverId === camera.id) {
      setCameraSnapshots((prev) => ({
        ...prev,
        [camera.id]: null,
      }));
    }

    setLoadingSnapshots((prev) => ({ ...prev, [camera.id]: true }));

    try {
      const response = await fetch(
        `${process.env.BACK_API_URL}/snapshot/${camera.source}?width=200&height=150`,
        {
          headers: {
            Authorization: `X-Session-Id ${sessionId}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        setCameraSnapshots((prev) => ({
          ...prev,
          [camera.id]: URL.createObjectURL(blob),
        }));
      } else {
        setCameraSnapshots((prev) => ({ ...prev, [camera.id]: null }));
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = error; // Acknowledge the error without using it
      setCameraSnapshots((prev) => ({ ...prev, [camera.id]: null }));
    } finally {
      setLoadingSnapshots((prev) => ({ ...prev, [camera.id]: false }));
    }
  };

  const handlePopoverOpenChange = (open: boolean, cameraId: string) => {
    if (open) {
      setOpenPopoverId(cameraId);
      // Initiate snapshot loading if not already loaded
      const camera = cameras.find((cam) => cam.id === cameraId);
      if (camera && !cameraSnapshots[cameraId]) {
        loadSnapshot(camera);
      }
    } else {
      setOpenPopoverId(null);
    }
  };

  const renderSnapshotContent = (cameraId: string, cameraName: string) => {
    if (loadingSnapshots[cameraId]) {
      return (
        <div className="h-[150px] w-[200px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (cameraSnapshots[cameraId]) {
      return (
        <img
          src={cameraSnapshots[cameraId] || ''}
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
      <div className="flex items-center space-x-2">
        <Checkbox
          id="select-all"
          checked={
            selectedCameras.length === cameras.length && cameras.length > 0
          }
          onCheckedChange={toggleAllCameras}
        />
        <Label htmlFor="select-all" className="text-sm font-medium">
          Sélectionner tout
        </Label>
      </div>
      <div className="space-y-2">
        {isLoading
          ? Array(4)
            .fill(0)
            .map((_, i) => (
                <div
                  key={`loading-skeleton-${i}`}
                  className="flex items-center space-x-2"
                >
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-5 w-32" />
                </div>
            ))
          : cameras.map((camera) => (
              <div
                key={camera.id}
                className="flex items-center justify-between"
              >
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
                      {loadingSnapshots[camera.id] ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    {renderSnapshotContent(camera.id, camera.name)}
                  </PopoverContent>
                </Popover>
              </div>
          ))}
      </div>
    </div>
  );

  return (
    <AccordionItem value="sources">
      <AccordionTrigger>Sources vidéo</AccordionTrigger>
      <AccordionContent>
        {useScrollArea ? (
          <ScrollArea className="pr-4" style={{ maxHeight }}>
            {content}
          </ScrollArea>
        ) : (
          content
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
