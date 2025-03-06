/* eslint-disable */
// In Attributes.tsx
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import ColorPicker from './ui/color-picker';
import MultiSelect from '@/components/multi-select';
import {
  hairLengthOptions,
  hairStyleOptions,
  topTypeOptions,
  bottomTypeOptions,
  toleranceOptions,
} from '../lib/form-config';
import type { Color } from '../lib/form-config';
import carBrands from '../lib/car-brand.json';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AttributesProps {
  selectedClass: string;
  colors: Color[];
  selectedHairColors?: string[];
  onHairColorsChange?: (colors: string[]) => void;
  selectedTopColors?: string[];
  onTopColorsChange?: (colors: string[]) => void;
  selectedBottomColors?: string[];
  onBottomColorsChange?: (colors: string[]) => void;
  useScrollArea?: boolean;
  maxHeight?: string;
  selectedHairLength?: string[];
  onHairLengthChange?: (length: string[]) => void;
  selectedHairStyle?: string[];
  onHairStyleChange?: (style: string[]) => void;
  selectedTopType?: string[];
  onTopTypeChange?: (type: string[]) => void;
  selectedBottomType?: string[];
  onBottomTypeChange?: (type: string[]) => void;
  selectedToleranceOptions?: string[];
  onToleranceOptionsChange?: (options: string[]) => void;
  // Vehicle specific props
  selectedBrands?: string[];
  onBrandsChange?: (brands: string[]) => void;
  selectedModels?: string[];
  onModelsChange?: (models: string[]) => void;
  licensePlate?: string;
  onLicensePlateChange?: (plate: string) => void;
  distinctiveFeatures?: { [key: string]: boolean };
  onDistinctiveFeaturesChange?: (id: string, checked: boolean) => void;
  contextFeatures?: { [key: string]: boolean };
  onContextFeaturesChange?: (id: string, checked: boolean) => void;
}

export default function Attributes({
  selectedClass,
  colors,
  selectedHairColors = [],
  onHairColorsChange,
  selectedTopColors = [],
  onTopColorsChange,
  selectedBottomColors = [],
  onBottomColorsChange,
  useScrollArea = false,
  maxHeight = '300px',
  selectedHairLength = [],
  onHairLengthChange,
  selectedHairStyle = [],
  onHairStyleChange,
  selectedTopType = [],
  onTopTypeChange,
  selectedBottomType = [],
  onBottomTypeChange,
  selectedToleranceOptions = [],
  onToleranceOptionsChange,
  // Vehicle specific props
  selectedBrands = [],
  onBrandsChange,
  selectedModels = [],
  onModelsChange,
  licensePlate = '',
  onLicensePlateChange,
  distinctiveFeatures = {},
  onDistinctiveFeaturesChange,
  contextFeatures = {},
  onContextFeaturesChange,
}: AttributesProps) {
  // Use local state if no handler is provided
  const [localSelectedHairColors, setLocalSelectedHairColors] = useState<
    string[]
  >([]);
  const [localSelectedTopColors, setLocalSelectedTopColors] = useState<
    string[]
  >([]);
  const [localSelectedBottomColors, setLocalSelectedBottomColors] = useState<
    string[]
  >([]);
  const [localSelectedHairLength, setLocalSelectedHairLength] = useState<
    string[]
  >([]);
  const [localSelectedHairStyle, setLocalSelectedHairStyle] = useState<
    string[]
  >([]);
  const [localSelectedTopType, setLocalSelectedTopType] = useState<string[]>(
    []
  );
  const [localSelectedBottomType, setLocalSelectedBottomType] = useState<
    string[]
  >([]);
  const [localSelectedTolerance, setLocalSelectedTolerance] = useState<
    string[]
  >([]);

  // Vehicle-specific state
  const [localSelectedBrands, setLocalSelectedBrands] = useState<string[]>([]);
  const [localSelectedModels, setLocalSelectedModels] = useState<string[]>([]);
  const [localLicensePlate, setLocalLicensePlate] = useState<string>('');
  const [localDistinctiveFeatures, setLocalDistinctiveFeatures] = useState<{
    [key: string]: boolean;
  }>({});
  const [localContextFeatures, setLocalContextFeatures] = useState<{
    [key: string]: boolean;
  }>({});

  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Update available models when brand changes
  useEffect(() => {
    if (selectedBrands.length > 0) {
      const models: string[] = [];
      selectedBrands.forEach((brand) => {
        const brandData = carBrands.find((item) => item.brand === brand);
        if (brandData) {
          models.push(...brandData.models);
        }
      });
      setAvailableModels(models);
    } else {
      setAvailableModels([]);
    }
  }, [selectedBrands]);

  // Handlers for person attributes
  const handleHairColorsChange = (values: string[]) => {
    if (onHairColorsChange) {
      onHairColorsChange(values);
    } else {
      setLocalSelectedHairColors(values);
    }
  };

  const handleTopColorsChange = (values: string[]) => {
    if (onTopColorsChange) {
      onTopColorsChange(values);
    } else {
      setLocalSelectedTopColors(values);
    }
  };

  const handleBottomColorsChange = (values: string[]) => {
    if (onBottomColorsChange) {
      onBottomColorsChange(values);
    } else {
      setLocalSelectedBottomColors(values);
    }
  };

  const handleHairLengthChange = (values: string[]) => {
    if (onHairLengthChange) {
      onHairLengthChange(values);
    } else {
      setLocalSelectedHairLength(values);
    }
  };

  const handleHairStyleChange = (values: string[]) => {
    if (onHairStyleChange) {
      onHairStyleChange(values);
    } else {
      setLocalSelectedHairStyle(values);
    }
  };

  const handleTopTypeChange = (values: string[]) => {
    if (onTopTypeChange) {
      onTopTypeChange(values);
    } else {
      setLocalSelectedTopType(values);
    }
  };

  const handleBottomTypeChange = (values: string[]) => {
    if (onBottomTypeChange) {
      onBottomTypeChange(values);
    } else {
      setLocalSelectedBottomType(values);
    }
  };

  const handleToleranceOptionsChange = (values: string[]) => {
    if (onToleranceOptionsChange) {
      onToleranceOptionsChange(values);
    } else {
      setLocalSelectedTolerance(values);
    }
  };

  // Handlers for vehicle attributes
  const handleBrandsChange = (values: string[]) => {
    if (onBrandsChange) {
      onBrandsChange(values);
    } else {
      setLocalSelectedBrands(values);
    }
  };

  const handleModelsChange = (values: string[]) => {
    if (onModelsChange) {
      onModelsChange(values);
    } else {
      setLocalSelectedModels(values);
    }
  };

  const handleLicensePlateChange = (value: string) => {
    if (onLicensePlateChange) {
      onLicensePlateChange(value);
    } else {
      setLocalLicensePlate(value);
    }
  };

  const handleDistinctiveFeaturesChange = (
    featureId: string,
    checked: boolean
  ) => {
    if (onDistinctiveFeaturesChange) {
      onDistinctiveFeaturesChange(featureId, checked);
    } else {
      setLocalDistinctiveFeatures((prev) => ({
        ...prev,
        [featureId]: checked,
      }));
    }
  };

  const handleContextFeaturesChange = (featureId: string, checked: boolean) => {
    if (onContextFeaturesChange) {
      onContextFeaturesChange(featureId, checked);
    } else {
      setLocalContextFeatures((prev) => ({
        ...prev,
        [featureId]: checked,
      }));
    }
  };

  // Getters for state values
  const getSelectedHairColors = () =>
    onHairColorsChange ? selectedHairColors : localSelectedHairColors;
  const getSelectedTopColors = () =>
    onTopColorsChange ? selectedTopColors : localSelectedTopColors;
  const getSelectedBottomColors = () =>
    onBottomColorsChange ? selectedBottomColors : localSelectedBottomColors;
  const getSelectedHairLength = () =>
    onHairLengthChange ? selectedHairLength : localSelectedHairLength;
  const getSelectedHairStyle = () =>
    onHairStyleChange ? selectedHairStyle : localSelectedHairStyle;
  const getSelectedTopType = () =>
    onTopTypeChange ? selectedTopType : localSelectedTopType;
  const getSelectedBottomType = () =>
    onBottomTypeChange ? selectedBottomType : localSelectedBottomType;
  const getSelectedTolerance = () =>
    onToleranceOptionsChange
      ? selectedToleranceOptions
      : localSelectedTolerance;

  // Getters for vehicle attributes
  const getSelectedBrands = () =>
    onBrandsChange ? selectedBrands : localSelectedBrands;
  const getSelectedModels = () =>
    onModelsChange ? selectedModels : localSelectedModels;
  const getLicensePlate = () =>
    onLicensePlateChange ? licensePlate : localLicensePlate;
  const getDistinctiveFeatures = () =>
    onDistinctiveFeaturesChange
      ? distinctiveFeatures
      : localDistinctiveFeatures;
  const getContextFeatures = () =>
    onContextFeaturesChange ? contextFeatures : localContextFeatures;

  // Get data from import
  const distinctiveItems = {
    person: [
      { id: 'bag', label: 'Bag/Luggage' },
      { id: 'hat', label: 'Headwear' },
      { id: 'glasses', label: 'Glasses' },
      { id: 'mask', label: 'Mask/Balaclava' },
    ],
    vehicle: [
      { id: 'damaged', label: 'Visible Damage' },
      { id: 'modified', label: 'Modifications' },
      { id: 'tinted', label: 'Tinted Windows' },
      { id: 'roof_rack', label: 'Roof Rack/Box' },
    ],
  };

  const contextualItems = {
    person: [
      { id: 'group', label: 'In Group' },
      { id: 'running', label: 'Running/Fleeing' },
      { id: 'vehicle', label: 'With Vehicle' },
      { id: 'suspicious', label: 'Suspicious Behavior' },
    ],
    vehicle: [
      { id: 'speeding', label: 'Excessive Speed' },
      { id: 'suspicious_behavior', label: 'Suspicious Behavior' },
      { id: 'multiple_occupants', label: 'Multiple Occupants' },
    ],
  };

  const content = (
    <>
      {selectedClass === 'person' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Couleur de cheveux</Label>
              <ColorPicker
                colors={colors}
                selected={getSelectedHairColors()}
                onChange={onHairColorsChange || setLocalSelectedHairColors}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Longueur de cheveux</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={hairLengthOptions.map((option) => ({
                    value: option.toLowerCase(),
                    label: option,
                  }))}
                  selected={getSelectedHairLength()}
                  onChange={handleHairLengthChange}
                  placeholder="Sélectionner longueur"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Couleur haut</Label>
              <ColorPicker
                colors={colors}
                selected={getSelectedTopColors()}
                onChange={onTopColorsChange || setLocalSelectedTopColors}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type de haut</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={topTypeOptions.map((option) => ({
                    value: option.toLowerCase(),
                    label: option,
                  }))}
                  selected={getSelectedTopType()}
                  onChange={handleTopTypeChange}
                  placeholder="Sélectionner type"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Couleur bas</Label>
              <ColorPicker
                colors={colors}
                selected={getSelectedBottomColors()}
                onChange={onBottomColorsChange || setLocalSelectedBottomColors}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type de bas</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={bottomTypeOptions.map((option) => ({
                    value: option.toLowerCase(),
                    label: option,
                  }))}
                  selected={getSelectedBottomType()}
                  onChange={handleBottomTypeChange}
                  placeholder="Sélectionner type"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Signes distinctifs</Label>
            <div className="grid grid-cols-2 gap-2">
              {distinctiveItems.person.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`distinctive-${item.id}`}
                    checked={getDistinctiveFeatures()[item.id] || false}
                    onCheckedChange={(checked) =>
                      handleDistinctiveFeaturesChange(item.id, !!checked)
                    }
                  />
                  <Label htmlFor={`distinctive-${item.id}`} className="text-sm">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Contexte</Label>
            <div className="grid grid-cols-2 gap-2">
              {contextualItems.person.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`context-${item.id}`}
                    checked={getContextFeatures()[item.id] || false}
                    onCheckedChange={(checked) =>
                      handleContextFeaturesChange(item.id, !!checked)
                    }
                  />
                  <Label htmlFor={`context-${item.id}`} className="text-sm">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium">Marque</Label>
            <div className="h-10 max-w-[250px]">
              <MultiSelect
                options={carBrands.map((brand) => ({
                  value: brand.brand,
                  label: brand.brand,
                }))}
                selected={getSelectedBrands()}
                onChange={handleBrandsChange}
                placeholder="Sélectionner marque"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Modèle</Label>
            <div className="h-10 max-w-[250px]">
              <MultiSelect
                options={carBrands
                  .filter((brand) => getSelectedBrands().includes(brand.brand))
                  .flatMap((brand) =>
                    brand.models.map((model) => ({
                      value: model,
                      label: model,
                    }))
                  )}
                selected={getSelectedModels()}
                onChange={handleModelsChange}
                placeholder="Sélectionner modèle"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="plate">
              Plaque d&apos;immatriculation
            </Label>
            <div className="h-10 max-w-[250px]">
              <Input
                id="plate"
                value={getLicensePlate()}
                onChange={(e) => handleLicensePlateChange(e.target.value)}
                placeholder="Ex: AB-123-CD"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Signes distinctifs</Label>
            <div className="grid grid-cols-2 gap-2">
              {distinctiveItems.vehicle.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`distinctive-${item.id}`}
                    checked={getDistinctiveFeatures()[item.id] || false}
                    onCheckedChange={(checked) =>
                      handleDistinctiveFeaturesChange(item.id, !!checked)
                    }
                  />
                  <Label htmlFor={`distinctive-${item.id}`} className="text-sm">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Contexte</Label>
            <div className="grid grid-cols-2 gap-2">
              {contextualItems.vehicle.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`context-${item.id}`}
                    checked={getContextFeatures()[item.id] || false}
                    onCheckedChange={(checked) =>
                      handleContextFeaturesChange(item.id, !!checked)
                    }
                  />
                  <Label htmlFor={`context-${item.id}`} className="text-sm">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t">
        <Label className="text-sm font-medium">Tolérance attributs</Label>
        <div className="h-10 max-w-[250px]">
          <MultiSelect
            options={toleranceOptions.map((option) => ({
              value: option.toLowerCase(),
              label: option,
            }))}
            selected={getSelectedTolerance()}
            onChange={handleToleranceOptionsChange}
            placeholder="Niveau de tolérance"
          />
        </div>
      </div>
    </>
  );

  return (
    <AccordionItem value="attributes">
      <AccordionTrigger>Attributs spécifiques</AccordionTrigger>
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
