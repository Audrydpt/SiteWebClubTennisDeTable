import { useState } from 'react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import ColorPicker from './ui/color-picker';
import MultiSelect from '@/components/multi-select';
import type { Color } from '../lib/types';
import { Label } from '@/components/ui/label';

interface AppearancesProps {
  selectedClass: string;
  colors: Color[];
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  vehicleTypes: string[];
  useScrollArea?: boolean;
  maxHeight?: string;
  selectedGenders?: string[];
  onGendersChange?: (genders: string[]) => void;
  selectedAges?: string[];
  onAgesChange?: (ages: string[]) => void;
  selectedBuilds?: string[];
  onBuildsChange?: (builds: string[]) => void;
  selectedHeights?: string[];
  onHeightsChange?: (heights: string[]) => void;
  selectedVehicleCategories?: string[];
  onVehicleCategoriesChange?: (categories: string[]) => void;
  selectedSizes?: string[];
  onSizesChange?: (sizes: string[]) => void;
  selectedTolerance?: string[];
  onToleranceChange?: (tolerance: string[]) => void;
}

export default function Appearances({
  selectedClass,
  colors,
  selectedColors,
  onColorsChange,
  vehicleTypes,
  useScrollArea = false,
  maxHeight = '300px',
  selectedGenders = [],
  onGendersChange,
  selectedAges = [],
  onAgesChange,
  selectedBuilds = [],
  onBuildsChange,
  selectedHeights = [],
  onHeightsChange,
  selectedVehicleCategories = [],
  onVehicleCategoriesChange,
  selectedSizes = [],
  onSizesChange,
  selectedTolerance = [],
  onToleranceChange,
}: AppearancesProps) {
  // Options for different select fields
  const genderOptions = ['Homme', 'Femme'];
  const ageOptions = ['Enfant', 'Adulte', 'Personne âgée'];
  const buildOptions = ['Mince', 'Moyenne', 'Athlétique', 'Forte'];
  const heightOptions = [
    'Petite (<1m65)',
    'Moyenne (1m65-1m80)',
    'Grande (>1m80)',
  ];
  const sizeOptions = ['Petit', 'Moyen', 'Grand'];
  const toleranceOptions = ['Stricte', 'Normale', 'Flexible'];

  // Use local state if no handler is provided
  const [localSelectedGenders, setLocalSelectedGenders] = useState<string[]>(
    []
  );
  const [localSelectedAges, setLocalSelectedAges] = useState<string[]>([]);
  const [localSelectedBuilds, setLocalSelectedBuilds] = useState<string[]>([]);
  const [localSelectedHeights, setLocalSelectedHeights] = useState<string[]>(
    []
  );
  const [localSelectedVehicleCategories, setLocalSelectedVehicleCategories] =
    useState<string[]>([]);
  const [localSelectedSizes, setLocalSelectedSizes] = useState<string[]>([]);
  const [localSelectedTolerance, setLocalSelectedTolerance] = useState<
    string[]
  >([]);

  // Handlers combining local and prop-based state
  const handleGendersChange = (values: string[]) => {
    if (onGendersChange) {
      onGendersChange(values);
    } else {
      setLocalSelectedGenders(values);
    }
  };

  const handleAgesChange = (values: string[]) => {
    if (onAgesChange) {
      onAgesChange(values);
    } else {
      setLocalSelectedAges(values);
    }
  };

  const handleBuildsChange = (values: string[]) => {
    if (onBuildsChange) {
      onBuildsChange(values);
    } else {
      setLocalSelectedBuilds(values);
    }
  };

  const handleHeightsChange = (values: string[]) => {
    if (onHeightsChange) {
      onHeightsChange(values);
    } else {
      setLocalSelectedHeights(values);
    }
  };

  const handleVehicleCategoriesChange = (values: string[]) => {
    if (onVehicleCategoriesChange) {
      onVehicleCategoriesChange(values);
    } else {
      setLocalSelectedVehicleCategories(values);
    }
  };

  const handleSizesChange = (values: string[]) => {
    if (onSizesChange) {
      onSizesChange(values);
    } else {
      setLocalSelectedSizes(values);
    }
  };

  const handleToleranceChange = (values: string[]) => {
    if (onToleranceChange) {
      onToleranceChange(values);
    } else {
      setLocalSelectedTolerance(values);
    }
  };

  const getSelectedGenders = () =>
    onGendersChange ? selectedGenders : localSelectedGenders;
  const getSelectedAges = () =>
    onAgesChange ? selectedAges : localSelectedAges;
  const getSelectedBuilds = () =>
    onBuildsChange ? selectedBuilds : localSelectedBuilds;
  const getSelectedHeights = () =>
    onHeightsChange ? selectedHeights : localSelectedHeights;
  const getSelectedVehicleCategories = () =>
    onVehicleCategoriesChange
      ? selectedVehicleCategories
      : localSelectedVehicleCategories;
  const getSelectedSizes = () =>
    onSizesChange ? selectedSizes : localSelectedSizes;
  const getSelectedTolerance = () =>
    onToleranceChange ? selectedTolerance : localSelectedTolerance;

  const content = (
    <>
      {selectedClass === 'person' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Genre</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={genderOptions}
                  selected={getSelectedGenders()}
                  onChange={handleGendersChange}
                  placeholder="Sélectionner genre"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Âge approximatif</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={ageOptions}
                  selected={getSelectedAges()}
                  onChange={handleAgesChange}
                  placeholder="Sélectionner âge"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Corpulence</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={buildOptions}
                  selected={getSelectedBuilds()}
                  onChange={handleBuildsChange}
                  placeholder="Sélectionner corpulence"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Taille approximative
              </Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={heightOptions}
                  selected={getSelectedHeights()}
                  onChange={handleHeightsChange}
                  placeholder="Sélectionner taille"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Couleurs dominantes des vêtements
            </Label>
            <ColorPicker
              colors={colors}
              selected={selectedColors}
              onChange={onColorsChange}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Catégorie de véhicule</Label>
            <div className="h-10 max-w-[250px]">
              <MultiSelect
                options={vehicleTypes}
                selected={getSelectedVehicleCategories()}
                onChange={handleVehicleCategoriesChange}
                placeholder="Sélectionner type de véhicule"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Couleur principale</Label>
            <ColorPicker
              colors={colors}
              selected={selectedColors}
              onChange={onColorsChange}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Gabarit</Label>
            <div className="h-10 max-w-[250px]">
              <MultiSelect
                options={sizeOptions}
                selected={getSelectedSizes()}
                onChange={handleSizesChange}
                placeholder="Sélectionner gabarit"
              />
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2 pt-4 border-t">
        <Label className="text-sm font-medium">Tolérance visuelle</Label>
        <div className="h-10 max-w-[250px]">
          <MultiSelect
            options={toleranceOptions}
            selected={getSelectedTolerance()}
            onChange={handleToleranceChange}
            placeholder="Niveau de tolérance"
          />
        </div>
      </div>
    </>
  );

  return (
    <AccordionItem value="appearance">
      <AccordionTrigger>Apparence générale</AccordionTrigger>
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
