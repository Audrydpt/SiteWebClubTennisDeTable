/* eslint-disable */
import { Checkbox } from '@/components/ui/checkbox';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Camera } from '../lib/types';

interface SourcesProps {
  cameras: Camera[];
  selectedCameras: string[];
  onCameraChange: (cameras: string[]) => void;
}

export default function Sources({
  cameras,
  selectedCameras,
  onCameraChange,
}: SourcesProps) {
  const toggleAllCameras = (checked: boolean) => {
    if (checked) {
      onCameraChange(cameras.map((cam) => cam.id));
    } else {
      onCameraChange([]);
    }
  };

  return (
    <AccordionItem value="sources">
      <AccordionTrigger>Sources vidéo</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedCameras.length === cameras.length}
              onCheckedChange={toggleAllCameras}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Sélectionner tout
            </label>
          </div>
          <div className="space-y-2">
            {cameras.map((camera) => (
              <div key={camera.id} className="flex items-center space-x-2">
                <Checkbox
                  id={camera.id}
                  checked={selectedCameras.includes(camera.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onCameraChange([...selectedCameras, camera.id]);
                    } else {
                      onCameraChange(
                        selectedCameras.filter((id) => id !== camera.id)
                      );
                    }
                  }}
                />
                <label htmlFor={camera.id} className="text-sm font-medium">
                  {camera.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
