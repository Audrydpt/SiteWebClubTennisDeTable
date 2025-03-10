import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import ColorPicker from './ui/color-picker';
import MultiSelect from '@/components/multi-select';
import { Label } from '@/components/ui/label';
import {
  genderOptions,
  ageOptions,
  buildOptions,
  heightOptions,
  sizeOptions,
  toleranceOptions,
  vehicleTypes,
  hairLengthOptions,
  hairStyleOptions,
} from '../lib/form-config';
import type { Color } from '../lib/form-config';

interface AppearancesProps {
  selectedClass: string;
  colors: Color[];
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
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
  // Hair properties moved from AttributesProps
  selectedHairColors?: string[];
  onHairColorsChange?: (colors: string[]) => void;
  selectedHairLength?: string[];
  onHairLengthChange?: (length: string[]) => void;
  selectedHairStyle?: string[];
  onHairStyleChange?: (style: string[]) => void;
}

export default function Appearances({
  selectedClass,
  colors,
  selectedColors,
  onColorsChange,
  useScrollArea = false,
  maxHeight = '300px',
  selectedGenders = [],
  onGendersChange = () => {},
  selectedAges = [],
  onAgesChange = () => {},
  selectedBuilds = [],
  onBuildsChange = () => {},
  selectedHeights = [],
  onHeightsChange = () => {},
  selectedVehicleCategories = [],
  onVehicleCategoriesChange = () => {},
  selectedSizes = [],
  onSizesChange = () => {},
  selectedTolerance = [],
  onToleranceChange = () => {},
  // Hair properties with defaults
  selectedHairColors = [],
  onHairColorsChange = () => {},
  selectedHairLength = [],
  onHairLengthChange = () => {},
  selectedHairStyle = [],
  onHairStyleChange = () => {},
}: AppearancesProps) {
  // Extract option values for MultiSelect compatibility
  const genderValues = genderOptions.map((option) => option.value);
  const ageValues = ageOptions.map((option) => option.value);
  const buildValues = buildOptions.map((option) => option.value);
  const heightValues = heightOptions.map((option) => option.value);
  const sizeValues = sizeOptions.map((option) => option.value);
  const toleranceValues = toleranceOptions.map((option) => option.value);
  const vehicleTypeValues = vehicleTypes.map((option) => option.value);
  const hairLengthValues = hairLengthOptions.map((option) => option.value);
  const hairStyleValues = hairStyleOptions.map((option) => option.value);

  const content = (
    <>
      {selectedClass === 'person' ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Couleur générale</Label>
            <ColorPicker
              colors={colors}
              selected={selectedColors}
              onChange={onColorsChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Genre</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={genderValues}
                  selected={selectedGenders}
                  onChange={onGendersChange}
                  placeholder="Genre"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Age</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={ageValues}
                  selected={selectedAges}
                  onChange={onAgesChange}
                  placeholder="Age"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Corpulence</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={buildValues}
                  selected={selectedBuilds}
                  onChange={onBuildsChange}
                  placeholder="Corpulence"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Taille</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={heightValues}
                  selected={selectedHeights}
                  onChange={onHeightsChange}
                  placeholder="Taille"
                />
              </div>
            </div>
          </div>

          {/* Hair section - moved from attributes */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium">Cheveux</Label>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Couleur de cheveux</Label>
              <ColorPicker
                colors={colors}
                selected={selectedHairColors}
                onChange={onHairColorsChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Longueur</Label>
                <div className="h-10 max-w-full">
                  <MultiSelect
                    options={hairLengthValues}
                    selected={selectedHairLength}
                    onChange={onHairLengthChange}
                    placeholder="Longueur"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Style</Label>
                <div className="h-10 max-w-full">
                  <MultiSelect
                    options={hairStyleValues}
                    selected={selectedHairStyle}
                    onChange={onHairStyleChange}
                    placeholder="Style"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Couleur du véhicule</Label>
            <ColorPicker
              colors={colors}
              selected={selectedColors}
              onChange={onColorsChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type de véhicule</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={vehicleTypeValues}
                  selected={selectedVehicleCategories}
                  onChange={onVehicleCategoriesChange}
                  placeholder="Type de véhicule"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Taille</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={sizeValues}
                  selected={selectedSizes}
                  onChange={onSizesChange}
                  placeholder="Taille"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2 pt-4 border-t">
        <Label className="text-sm font-medium">Tolérance visuelle</Label>
        <div className="h-10 max-w-[250px]">
          <MultiSelect
            options={toleranceValues}
            selected={selectedTolerance}
            onChange={onToleranceChange}
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
