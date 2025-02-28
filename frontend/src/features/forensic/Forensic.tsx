import { useState } from 'react';
import { Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Appearances from '@/features/forensic/components/appareances';
import Sources from '@/features/forensic/components/sources';
import Times from '@/features/forensic/components/times';
import Attributes from '@/features/forensic/components/attributes';
import Types from '@/features/forensic/components/types';
import { cameras, vehicleTypes } from './lib/constants';
import { colors } from '@/features/forensic/components/colors/colors';

export default function Forensic() {
  const [date, setDate] = useState<Date>();
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('person');
  const [tolerance, setTolerance] = useState<number>(50);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTopColors, setSelectedTopColors] = useState<string[]>([]);
  const [selectedBottomColors, setSelectedBottomColors] = useState<string[]>(
    []
  );
  const [selectedHairColors, setSelectedHairColors] = useState<string[]>([]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-4 h-full">
      {/* Controls Panel */}
      <Card className="h-full overflow-hidden flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Recherche vidéo</h1>
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </Button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Accordion
              type="single"
              defaultValue="sources"
              collapsible
              className="flex-1"
            >
              <Sources
                cameras={cameras}
                selectedCameras={selectedCameras}
                onCameraChange={setSelectedCameras}
                useScrollArea
                maxHeight="1000px"
              />
              <Times date={date} onDateChange={setDate} />
              <Types
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
              />
              <Appearances
                selectedClass={selectedClass}
                colors={colors}
                selectedColors={selectedColors}
                onColorsChange={setSelectedColors}
                vehicleTypes={vehicleTypes}
                useScrollArea
                maxHeight="1000px"
              />
              <Attributes
                selectedClass={selectedClass}
                colors={colors}
                tolerance={tolerance}
                onToleranceChange={setTolerance}
                selectedHairColors={selectedHairColors}
                onHairColorsChange={setSelectedHairColors}
                selectedTopColors={selectedTopColors}
                onTopColorsChange={setSelectedTopColors}
                selectedBottomColors={selectedBottomColors}
                onBottomColorsChange={setSelectedBottomColors}
                useScrollArea
                maxHeight="1000px"
              />
            </Accordion>
          </div>

          <div className="mt-4">
            <Button className="w-full" size="lg">
              <Search className="mr-2 h-4 w-4" />
              Lancer la recherche
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Area */}
      <div className="h-full">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {selectedCameras.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex h-[50vh] items-center justify-center text-muted-foreground">
                  Sélectionnez une ou plusieurs caméras pour commencer
                </CardContent>
              </Card>
            ) : (
              selectedCameras.map((camId) => (
                <Card key={camId} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-video relative">
                      <video
                        className="h-full w-full object-cover"
                        src="/placeholder.mp4"
                        controls
                      >
                        <track
                          kind="captions"
                          src="/placeholder-captions.vtt"
                          label="English captions"
                          srcLang="en"
                          default
                        />
                      </video>
                      <div className="absolute left-2 top-2 rounded bg-background/80 px-2 py-1 text-sm backdrop-blur-sm">
                        {cameras.find((cam) => cam.id === camId)?.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
