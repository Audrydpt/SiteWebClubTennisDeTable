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
  topTypeOptions,
  bottomTypeOptions,
  toleranceOptions,
  distinctiveItems,
  contextualItems,
} from '../lib/form-config';
import type { Color } from '../lib/form-config';
import carBrands from '../lib/car-brand.json';

interface AttributesProps {
  selectedClass: string;
  colors: Color[];
  // Hair properties removed
  selectedTopColors?: string[];
  onTopColorsChange?: (colors: string[]) => void;
  selectedBottomColors?: string[];
  onBottomColorsChange?: (colors: string[]) => void;
  useScrollArea?: boolean;
  maxHeight?: string;
  // Hair properties removed
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
  // Hair properties removed
  selectedTopColors = [],
  onTopColorsChange = () => {},
  selectedBottomColors = [],
  onBottomColorsChange = () => {},
  useScrollArea = false,
  maxHeight = '300px',
  // Hair properties removed
  selectedTopType = [],
  onTopTypeChange = () => {},
  selectedBottomType = [],
  onBottomTypeChange = () => {},
  selectedToleranceOptions = [],
  onToleranceOptionsChange = () => {},
  // Vehicle specific props
  selectedBrands = [],
  onBrandsChange = () => {},
  selectedModels = [],
  onModelsChange = () => {},
  licensePlate = '',
  onLicensePlateChange = () => {},
  distinctiveFeatures = {},
  onDistinctiveFeaturesChange = () => {},
  contextFeatures = {},
  onContextFeaturesChange = () => {},
}: AttributesProps) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Extract values from SelectOption objects for MultiSelect compatibility
  const topTypeValues = topTypeOptions.map((option) => option.value);
  const bottomTypeValues = bottomTypeOptions.map((option) => option.value);
  const toleranceValues = toleranceOptions.map((option) => option.value);

  // Update available models when selected brands change
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

  const content = (
    <>
      {selectedClass === 'person' ? (
        <div className="space-y-6">
          {/* Hair-related UI elements removed */}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type de haut</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={topTypeValues}
                  selected={selectedTopType}
                  onChange={onTopTypeChange}
                  placeholder="Type de haut"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Couleur haut</Label>
              <ColorPicker
                colors={colors}
                selected={selectedTopColors}
                onChange={onTopColorsChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type de bas</Label>
              <div className="h-10 max-w-full">
                <MultiSelect
                  options={bottomTypeValues}
                  selected={selectedBottomType}
                  onChange={onBottomTypeChange}
                  placeholder="Type de bas"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Couleur bas</Label>
              <ColorPicker
                colors={colors}
                selected={selectedBottomColors}
                onChange={onBottomColorsChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Signes distinctifs</Label>
            <div className="grid grid-cols-2 gap-2">
              {distinctiveItems.person.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`distinctive-${item.id}`}
                    checked={distinctiveFeatures[item.id] || false}
                    onCheckedChange={(checked) =>
                      onDistinctiveFeaturesChange(item.id, !!checked)
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
                    checked={contextFeatures[item.id] || false}
                    onCheckedChange={(checked) =>
                      onContextFeaturesChange(item.id, !!checked)
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
                options={carBrands.map((brand) => brand.brand)}
                selected={selectedBrands}
                onChange={onBrandsChange}
                placeholder="Marque du véhicule"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Modèle</Label>
            <div className="h-10 max-w-[250px]">
              <MultiSelect
                options={availableModels}
                selected={selectedModels}
                onChange={onModelsChange}
                placeholder="Modèle du véhicule"
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
                value={licensePlate}
                onChange={(e) => onLicensePlateChange(e.target.value)}
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
                    checked={distinctiveFeatures[item.id] || false}
                    onCheckedChange={(checked) =>
                      onDistinctiveFeaturesChange(item.id, !!checked)
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
                    checked={contextFeatures[item.id] || false}
                    onCheckedChange={(checked) =>
                      onContextFeaturesChange(item.id, !!checked)
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
            options={toleranceValues}
            selected={selectedToleranceOptions}
            onChange={onToleranceOptionsChange}
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
