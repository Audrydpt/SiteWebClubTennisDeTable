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
import { colors, vehicleTypes } from './lib/form-config';

export default function Forensic() {
  // Your existing state
  const [dateStr, setDateStr] = useState<string | undefined>(undefined);
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('person');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTopColors, setSelectedTopColors] = useState<string[]>([]);
  const [selectedBottomColors, setSelectedBottomColors] = useState<string[]>(
    []
  );
  const [selectedHairColors, setSelectedHairColors] = useState<string[]>([]);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const handleSearch = () => {
    setSearchSubmitted(true);
    // Here you would implement the actual search logic
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-4 h-full">
      {/* Controls Panel - Fixed height with scrollable content */}
      <Card className="h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Recherche vidéo</h1>
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </Button>
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <Accordion type="single" defaultValue="sources" collapsible>
                <Sources onSelectedCamerasChange={setSelectedCameras} />
                <Times date={dateStr} onDateChange={setDateStr} />
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
                  selectedHairColors={selectedHairColors}
                  onHairColorsChange={setSelectedHairColors}
                  selectedTopColors={selectedTopColors}
                  onTopColorsChange={setSelectedTopColors}
                  selectedBottomColors={selectedBottomColors}
                  onBottomColorsChange={setSelectedBottomColors}
                />
              </Accordion>
            </div>
          </ScrollArea>

          <div className="mt-4">
            <Button className="w-full" size="lg" onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Lancer la recherche
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Area - Fixed height with scrollable content */}
      <Card className="h-[calc(100vh-2rem)] overflow-hidden">
        <CardContent className="p-4 h-full">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Résultats de recherche</h2>
          </div>

          <ScrollArea className="h-[calc(100%-3rem)]">
            {!searchSubmitted || selectedCameras.length === 0 ? (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                {selectedCameras.length === 0
                  ? 'Sélectionnez une ou plusieurs caméras pour commencer'
                  : "Appuyez sur 'Lancer la recherche' pour afficher les résultats"}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Results would be displayed here after search is performed */}
                <div className="p-4 border rounded-md">
                  <p>
                    Résultats pour les caméras sélectionnées :{' '}
                    {selectedCameras.join(', ')}
                  </p>
                  <p>
                    Les résultats réels seront affichés ici après intégration
                    avec l&#39;API.
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
