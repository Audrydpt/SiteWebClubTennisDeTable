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
import type { Color, SelectOption } from '../lib/form-config';

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
  selectedHairColors = [],
  onHairColorsChange = () => {},
  selectedHairLength = [],
  onHairLengthChange = () => {},
  selectedHairStyle = [],
  onHairStyleChange = () => {},
}: AppearancesProps) {
  // Helper function to get label from value
  const getOptionLabelByValue = (
    options: SelectOption[],
    value: string
  ): string => {
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  // Get display labels for selected values
  const selectedGenderLabels = selectedGenders.map((value) =>
    getOptionLabelByValue(genderOptions, value)
  );

  const selectedAgeLabels = selectedAges.map((value) =>
    getOptionLabelByValue(ageOptions, value)
  );

  const selectedBuildLabels = selectedBuilds.map((value) =>
    getOptionLabelByValue(buildOptions, value)
  );

  const selectedHeightLabels = selectedHeights.map((value) =>
    getOptionLabelByValue(heightOptions, value)
  );

  const selectedSizeLabels = selectedSizes.map((value) =>
    getOptionLabelByValue(sizeOptions, value)
  );

  const selectedToleranceLabels = selectedTolerance.map((value) =>
    getOptionLabelByValue(toleranceOptions, value)
  );

  const selectedVehicleCategoryLabels = selectedVehicleCategories.map((value) =>
    getOptionLabelByValue(vehicleTypes, value)
  );

  const selectedHairLengthLabels = selectedHairLength.map((value) =>
    getOptionLabelByValue(hairLengthOptions, value)
  );

  const selectedHairStyleLabels = selectedHairStyle.map((value) =>
    getOptionLabelByValue(hairStyleOptions, value)
  );

  const content = (
    <>
      <div className="space-y-4">
        <Label className="text-sm font-medium">Couleur générale</Label>
        <ColorPicker
          colors={colors}
          selected={selectedColors}
          onChange={onColorsChange}
        />
      </div>

      {selectedClass === 'person' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Genre</Label>
            <div className="h-10 max-w-full">
              <MultiSelect
                options={genderOptions.map((option) => option.label)}
                selected={selectedGenderLabels}
                onChange={(selectedLabels) => {
                  const newValues = selectedLabels.map((label) => {
                    const option = genderOptions.find(
                      (opt) => opt.label === label
                    );
                    return option ? option.value : label;
                  });
                  onGendersChange(newValues);
                }}
                placeholder="Genre"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Age</Label>
            <div className="h-10 max-w-full">
              <MultiSelect
                options={ageOptions.map((option) => option.label)}
                selected={selectedAgeLabels}
                onChange={(selectedLabels) => {
                  const newValues = selectedLabels.map((label) => {
                    const option = ageOptions.find(
                      (opt) => opt.label === label
                    );
                    return option ? option.value : label;
                  });
                  onAgesChange(newValues);
                }}
                placeholder="Age"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Corpulence</Label>
            <div className="h-10 max-w-full">
              <MultiSelect
                options={buildOptions.map((option) => option.label)}
                selected={selectedBuildLabels}
                onChange={(selectedLabels) => {
                  const newValues = selectedLabels.map((label) => {
                    const option = buildOptions.find(
                      (opt) => opt.label === label
                    );
                    return option ? option.value : label;
                  });
                  onBuildsChange(newValues);
                }}
                placeholder="Corpulence"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Taille</Label>
            <div className="h-10 max-w-full">
              <MultiSelect
                options={heightOptions.map((option) => option.label)}
                selected={selectedHeightLabels}
                onChange={(selectedLabels) => {
                  const newValues = selectedLabels.map((label) => {
                    const option = heightOptions.find(
                      (opt) => opt.label === label
                    );
                    return option ? option.value : label;
                  });
                  onHeightsChange(newValues);
                }}
                placeholder="Taille"
              />
            </div>
          </div>

          {/* Hair sections */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cheveux - Couleur</Label>
            <ColorPicker
              colors={colors}
              selected={selectedHairColors}
              onChange={onHairColorsChange}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Cheveux - Longueur</Label>
            <div className="h-10 max-w-full">
              <MultiSelect
                options={hairLengthOptions.map((option) => option.label)}
                selected={selectedHairLengthLabels}
                onChange={(selectedLabels) => {
                  const newValues = selectedLabels.map((label) => {
                    const option = hairLengthOptions.find(
                      (opt) => opt.label === label
                    );
                    return option ? option.value : label;
                  });
                  onHairLengthChange(newValues);
                }}
                placeholder="Longueur des cheveux"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Cheveux - Style</Label>
            <div className="h-10 max-w-full">
              <MultiSelect
                options={hairStyleOptions.map((option) => option.label)}
                selected={selectedHairStyleLabels}
                onChange={(selectedLabels) => {
                  const newValues = selectedLabels.map((label) => {
                    const option = hairStyleOptions.find(
                      (opt) => opt.label === label
                    );
                    return option ? option.value : label;
                  });
                  onHairStyleChange(newValues);
                }}
                placeholder="Style de cheveux"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Catégorie</Label>
            <div className="h-10 max-w-full">
              <MultiSelect
                options={vehicleTypes.map((option) => option.label)}
                selected={selectedVehicleCategoryLabels}
                onChange={(selectedLabels) => {
                  const newValues = selectedLabels.map((label) => {
                    const option = vehicleTypes.find(
                      (opt) => opt.label === label
                    );
                    return option ? option.value : label;
                  });
                  onVehicleCategoriesChange(newValues);
                }}
                placeholder="Catégorie de véhicule"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Taille</Label>
            <div className="h-10 max-w-full">
              <MultiSelect
                options={sizeOptions.map((option) => option.label)}
                selected={selectedSizeLabels}
                onChange={(selectedLabels) => {
                  const newValues = selectedLabels.map((label) => {
                    const option = sizeOptions.find(
                      (opt) => opt.label === label
                    );
                    return option ? option.value : label;
                  });
                  onSizesChange(newValues);
                }}
                placeholder="Taille du véhicule"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t">
        <Label className="text-sm font-medium">Tolérance apparence</Label>
        <div className="h-10 max-w-[250px]">
          <MultiSelect
            options={toleranceOptions.map((option) => option.label)}
            selected={selectedToleranceLabels}
            onChange={(selectedLabels) => {
              const newValues = selectedLabels.map((label) => {
                const option = toleranceOptions.find(
                  (opt) => opt.label === label
                );
                return option ? option.value : label;
              });
              onToleranceChange(newValues);
            }}
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
