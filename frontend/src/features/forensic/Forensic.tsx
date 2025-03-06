/* eslint-disable */
import { useState, useEffect } from 'react';
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
import { colors } from './lib/form-config';
import useSearch, { ForensicResult } from './hooks/use-search';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/auth-context.tsx';

import type { FormData as CustomFormData } from './lib/format-query';

export default function Forensic() {
  // Basic form state
  const [dateStr, setDateStr] = useState<string | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('23:59');
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('vehicle');
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  // Appearance fields
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedBuilds, setSelectedBuilds] = useState<string[]>([]);
  const [selectedHeights, setSelectedHeights] = useState<string[]>([]);
  const [selectedVehicleCategories, setSelectedVehicleCategories] = useState<
    string[]
  >([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedAppearanceTolerance, setSelectedAppearanceTolerance] =
    useState<string[]>([]);

  // Attributes fields
  const [selectedHairColors, setSelectedHairColors] = useState<string[]>([]);
  const [selectedTopColors, setSelectedTopColors] = useState<string[]>([]);
  const [selectedBottomColors, setSelectedBottomColors] = useState<string[]>(
    []
  );
  const [selectedHairLength, setSelectedHairLength] = useState<string[]>([]);
  const [selectedHairStyle, setSelectedHairStyle] = useState<string[]>([]);
  const [selectedTopType, setSelectedTopType] = useState<string[]>([]);
  const [selectedBottomType, setSelectedBottomType] = useState<string[]>([]);
  const [selectedAttributesTolerance, setSelectedAttributesTolerance] =
    useState<string[]>([]);

  // Add these state variables at the top of the component, with the other state declarations
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [distinctiveFeatures, setDistinctiveFeatures] = useState<{[key: string]: boolean}>({});
  const [contextFeatures, setContextFeatures] = useState<{[key: string]: boolean}>({});

  // Other state needed for the form
  const [selectedDistinctiveFeatures, setSelectedDistinctiveFeatures] =
    useState<{ [key: string]: boolean }>({});

  // Get sessionId from auth context
  const { sessionId = '' } = useAuth();

  // Use the search hook
  const {
    startSearch,
    initWebSocket,
    closeWebSocket,
    progress,
    results,
    isSearching,
  } = useSearch(sessionId);

  // Clean up object URLs when component unmounts
  useEffect(
    () => () => {
      results.forEach((result) => {
        if (result.imageData.startsWith('blob:')) {
          URL.revokeObjectURL(result.imageData);
        }
      });
    },
    [results]
  );

  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  const handleDistinctiveFeaturesChange = (featureId: string, checked: boolean) => {
    setDistinctiveFeatures(prev => ({
      ...prev,
      [featureId]: checked
    }));
  };

  const handleContextFeaturesChange = (featureId: string, checked: boolean) => {
    setContextFeatures(prev => ({
      ...prev,
      [featureId]: checked
    }));
  };

  const handleSearch = async () => {
    setSearchSubmitted(true);

    // Map appearance tolerance to expected format
    const toleranceMap: { [key: string]: 'low' | 'medium' | 'high' } = {
      faible: 'low',
      moyenne: 'medium',
      élevée: 'high',
    };

    const mappedAppearanceTolerance =
      selectedAppearanceTolerance.length > 0
        ? toleranceMap[selectedAppearanceTolerance[0]] || 'medium'
        : 'medium';

    const mappedAttributesTolerance =
      selectedAttributesTolerance.length > 0
        ? toleranceMap[selectedAttributesTolerance[0]] || 'medium'
        : 'medium';

    // Base form data shared between person and vehicle
    const baseFormData = {
      date: dateStr,
      startTime,
      endTime,
      cameras: selectedCameras,
      subjectType: selectedClass,
      appearance: {
        generalColors: selectedColors,
      },
      attributes: {
        distinctiveFeatures: selectedDistinctiveFeatures,
      },
      appearanceTolerance: mappedAppearanceTolerance,
      attributesTolerance: mappedAttributesTolerance,
    };

    // Build form data based on selected class type
    let formData: CustomFormData;

    if (selectedClass === 'vehicle') {
      formData = {
        ...baseFormData,
        vehicleCategory: selectedVehicleCategories,
        vehicleSize: selectedSizes,
        attributes: {
          ...baseFormData.attributes,
          vehicleColors: selectedColors,
          // Note: You'd need to add brand/model mapping here if implemented
        },
      };
    } else {
      formData = {
        ...baseFormData,
        appearance: {
          ...baseFormData.appearance,
          gender: selectedGenders,
          age: selectedAges,
          build: selectedBuilds,
          height: selectedHeights,
        },
        attributes: {
          ...baseFormData.attributes,
          hairColors: selectedHairColors,
          hairLength: selectedHairLength,
          hairStyle: selectedHairStyle,
          upperType: selectedTopType,
          topColors: selectedTopColors,
          lowerType: selectedBottomType,
          bottomColors: selectedBottomColors,
        },
      };
    }

    // Log the search parameters
    console.log('Search form data:', JSON.stringify(formData, null, 2));

    try {
      const guid = await startSearch(formData, 5);
      initWebSocket(guid);
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-4 h-full">
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
                <Times
                  date={dateStr}
                  onDateChange={setDateStr}
                  onTimeChange={handleTimeChange}
                />
                <Types
                  selectedClass={selectedClass}
                  onClassChange={setSelectedClass}
                />
                <Appearances
                  selectedClass={selectedClass}
                  colors={colors}
                  selectedColors={selectedColors}
                  onColorsChange={setSelectedColors}
                  selectedGenders={selectedGenders}
                  onGendersChange={setSelectedGenders}
                  selectedAges={selectedAges}
                  onAgesChange={setSelectedAges}
                  selectedBuilds={selectedBuilds}
                  onBuildsChange={setSelectedBuilds}
                  selectedHeights={selectedHeights}
                  onHeightsChange={setSelectedHeights}
                  selectedVehicleCategories={selectedVehicleCategories}
                  onVehicleCategoriesChange={setSelectedVehicleCategories}
                  selectedSizes={selectedSizes}
                  onSizesChange={setSelectedSizes}
                  selectedTolerance={selectedAppearanceTolerance}
                  onToleranceChange={setSelectedAppearanceTolerance}
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
                  selectedHairLength={selectedHairLength}
                  onHairLengthChange={setSelectedHairLength}
                  selectedHairStyle={selectedHairStyle}
                  onHairStyleChange={setSelectedHairStyle}
                  selectedTopType={selectedTopType}
                  onTopTypeChange={setSelectedTopType}
                  selectedBottomType={selectedBottomType}
                  onBottomTypeChange={setSelectedBottomType}
                  selectedToleranceOptions={selectedAttributesTolerance}
                  onToleranceOptionsChange={setSelectedAttributesTolerance}
                  selectedBrands={selectedBrands}
                  onBrandsChange={setSelectedBrands}
                  selectedModels={selectedModels}
                  onModelsChange={setSelectedModels}
                  licensePlate={licensePlate}
                  onLicensePlateChange={setLicensePlate}
                  distinctiveFeatures={distinctiveFeatures}
                  onDistinctiveFeaturesChange={handleDistinctiveFeaturesChange}
                  contextFeatures={contextFeatures}
                  onContextFeaturesChange={handleContextFeaturesChange}
                />
              </Accordion>
            </div>
          </ScrollArea>

          <div className="mt-4">
            <Button onClick={handleSearch} className="w-full">
              <Search className="mr-2 h-4 w-4" />
              Lancer la recherche
            </Button>
          </div>

          {isSearching && (
            <div className="mt-2">
              <Button
                onClick={closeWebSocket}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Annuler la recherche
              </Button>
              {progress !== null && (
                <Progress value={progress} className="h-2 mt-2" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Area */}
      <Card className="h-[calc(100vh-2rem)] overflow-hidden">
        <CardContent className="p-4 h-full">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Résultats de recherche</h2>
            {progress !== null && progress < 100 && (
              <div className="mt-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  Progression: {progress}%
                </p>
              </div>
            )}
          </div>

          <ScrollArea className="h-[calc(100%-3rem)]">
            {!searchSubmitted || selectedCameras.length === 0 ? (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                {selectedCameras.length === 0
                  ? 'Sélectionnez une ou plusieurs caméras pour commencer'
                  : "Appuyez sur 'Lancer la recherche' pour afficher les résultats"}
              </div>
            ) : isSearching ? (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                Recherche en cours...
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {results.map((result: ForensicResult) => (
                  <div
                    key={result.id}
                    className="border rounded-md overflow-hidden"
                  >
                    <img
                      src={result.imageData}
                      alt="Forensic result"
                      className="w-full h-auto"
                    />
                    <div className="p-2">
                      <p className="text-sm">
                        Time: {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                Aucun résultat trouvé
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
