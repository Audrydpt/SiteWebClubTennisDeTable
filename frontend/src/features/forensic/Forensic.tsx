import { useState } from 'react';
import { Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar fixe */}
      <div className="w-[400px] flex-shrink-0 border-r overflow-y-auto h-screen">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recherche vidéo</h2>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>

          <Accordion type="single" defaultValue="sources" collapsible>
            <Sources
              cameras={cameras}
              selectedCameras={selectedCameras}
              onCameraChange={setSelectedCameras}
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
            />
          </Accordion>

          <Separator />

          <Button className="w-full" size="lg">
            <Search className="mr-2 h-4 w-4" />
            Lancer la recherche
          </Button>
        </div>
      </div>

      {/* Zone principale */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedCameras.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center h-[50vh] text-muted-foreground">
                Sélectionnez une ou plusieurs caméras pour commencer
              </CardContent>
            </Card>
          ) : (
            selectedCameras.map((camId) => (
              <Card key={camId} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video relative">
                    <video
                      className="w-full h-full object-cover"
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
                    <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-sm">
                      {cameras.find((cam) => cam.id === camId)?.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
