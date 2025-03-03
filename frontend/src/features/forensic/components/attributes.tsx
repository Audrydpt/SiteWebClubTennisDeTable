import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import ColorPicker from './ui/color-picker';
import MultiSelect from '@/components/multi-select';
import type { Color } from '../lib/types';

interface AttributesProps {
  selectedClass: string;
  colors: Color[];
  selectedHairColors: string[];
  onHairColorsChange: (colors: string[]) => void;
  selectedTopColors: string[];
  onTopColorsChange: (colors: string[]) => void;
  selectedBottomColors: string[];
  onBottomColorsChange: (colors: string[]) => void;
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
}

export default function Attributes({
  selectedClass,
  colors,
  selectedHairColors,
  onHairColorsChange,
  selectedTopColors,
  onTopColorsChange,
  selectedBottomColors,
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
}: AttributesProps) {
  // Options for different select fields
  const hairLengthOptions = ['Courts', 'Mi-longs', 'Longs'];
  const hairStyleOptions = ['Lisses', 'Ondulés', 'Bouclés', 'Chauve'];
  const topTypeOptions = ['T-shirt', 'Chemise', 'Pull', 'Veste', 'Manteau'];
  const bottomTypeOptions = ['Pantalon', 'Short', 'Jupe', 'Robe'];
  const toleranceOptions = ['Stricte', 'Normale', 'Flexible'];

  // Use local state if no handler is provided
  const [localHairLength, setLocalHairLength] = useState<string[]>([]);
  const [localHairStyle, setLocalHairStyle] = useState<string[]>([]);
  const [localTopType, setLocalTopType] = useState<string[]>([]);
  const [localBottomType, setLocalBottomType] = useState<string[]>([]);
  const [localToleranceOptions, setLocalToleranceOptions] = useState<string[]>(
    []
  );

  // Handle events - update both local state and props if available
  const handleHairLengthChange = (values: string[]) => {
    if (onHairLengthChange) {
      onHairLengthChange(values);
    } else {
      setLocalHairLength(values);
    }
  };

  const handleHairStyleChange = (values: string[]) => {
    if (onHairStyleChange) {
      onHairStyleChange(values);
    } else {
      setLocalHairStyle(values);
    }
  };

  const handleTopTypeChange = (values: string[]) => {
    if (onTopTypeChange) {
      onTopTypeChange(values);
    } else {
      setLocalTopType(values);
    }
  };

  const handleBottomTypeChange = (values: string[]) => {
    if (onBottomTypeChange) {
      onBottomTypeChange(values);
    } else {
      setLocalBottomType(values);
    }
  };

  const handleToleranceOptionsChange = (values: string[]) => {
    if (onToleranceOptionsChange) {
      onToleranceOptionsChange(values);
    } else {
      setLocalToleranceOptions(values);
    }
  };

  // Getter functions to determine which state to use
  const getSelectedHairLength = () =>
    onHairLengthChange ? selectedHairLength : localHairLength;
  const getSelectedHairStyle = () =>
    onHairStyleChange ? selectedHairStyle : localHairStyle;
  const getSelectedTopType = () =>
    onTopTypeChange ? selectedTopType : localTopType;
  const getSelectedBottomType = () =>
    onBottomTypeChange ? selectedBottomType : localBottomType;
  const getSelectedToleranceOptions = () =>
    onToleranceOptionsChange ? selectedToleranceOptions : localToleranceOptions;

  const content = (
    <>
      {selectedClass === 'person' ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium">Cheveux</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Longueur</Label>
                <div className="h-10 max-w-[250px]">
                  <MultiSelect
                    options={hairLengthOptions}
                    selected={getSelectedHairLength()}
                    onChange={handleHairLengthChange}
                    placeholder="Longueur"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Style</Label>
                <div className="h-10 max-w-[250px]">
                  <MultiSelect
                    options={hairStyleOptions}
                    selected={getSelectedHairStyle()}
                    onChange={handleHairStyleChange}
                    placeholder="Style"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Couleur</Label>
                <div className="h-10 flex items-center">
                  <ColorPicker
                    colors={colors}
                    selected={selectedHairColors}
                    onChange={onHairColorsChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type de haut</Label>
                <div className="h-10 max-w-[250px]">
                  <MultiSelect
                    options={topTypeOptions}
                    selected={getSelectedTopType()}
                    onChange={handleTopTypeChange}
                    placeholder="Type de haut"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Couleur du haut</Label>
                <div className="h-10 flex items-center">
                  <ColorPicker
                    colors={colors}
                    selected={selectedTopColors}
                    onChange={onTopColorsChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type de bas</Label>
                <div className="h-10 max-w-[250px]">
                  <MultiSelect
                    options={bottomTypeOptions}
                    selected={getSelectedBottomType()}
                    onChange={handleBottomTypeChange}
                    placeholder="Type de bas"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Couleur du bas</Label>
                <div className="h-10 flex items-center">
                  <ColorPicker
                    colors={colors}
                    selected={selectedBottomColors}
                    onChange={onBottomColorsChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Éléments distinctifs</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="bag" />
                <Label htmlFor="bag" className="text-sm">
                  Sac/Bagage
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="hat" />
                <Label htmlFor="hat" className="text-sm">
                  Couvre-chef
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="glasses" />
                <Label htmlFor="glasses" className="text-sm">
                  Lunettes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="mask" />
                <Label htmlFor="mask" className="text-sm">
                  Masque/Cagoule
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Contexte</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="group" />
                <Label htmlFor="group" className="text-sm">
                  En groupe
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="running" />
                <Label htmlFor="running" className="text-sm">
                  Course/Fuite
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="vehicle" />
                <Label htmlFor="vehicle" className="text-sm">
                  Avec véhicule
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="suspicious" />
                <Label htmlFor="suspicious" className="text-sm">
                  Comportement suspect
                </Label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="brand">
                Marque
              </Label>
              <div className="h-10 max-w-[250px]">
                <Input
                  id="brand"
                  placeholder="Ex: Renault, Peugeot..."
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="model">
                Modèle
              </Label>
              <div className="h-10 max-w-[250px]">
                <Input
                  id="model"
                  placeholder="Ex: Clio, 208..."
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="plate">
                Immatriculation
              </Label>
              <div className="h-10 max-w-[250px]">
                <Input
                  id="plate"
                  placeholder="Ex: AB-123-CD"
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Couleur</Label>
              <div className="h-10 flex items-center">
                <ColorPicker
                  colors={colors}
                  selected={selectedTopColors}
                  onChange={onTopColorsChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Éléments distinctifs</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="damaged" />
                <Label htmlFor="damaged" className="text-sm">
                  Dommages visibles
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="modified" />
                <Label htmlFor="modified" className="text-sm">
                  Modifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="tinted" />
                <Label htmlFor="tinted" className="text-sm">
                  Vitres teintées
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="roof_rack" />
                <Label htmlFor="roof_rack" className="text-sm">
                  Galerie/Coffre
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Contexte</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="speeding" />
                <Label htmlFor="speeding" className="text-sm">
                  Vitesse excessive
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="suspicious_behavior" />
                <Label htmlFor="suspicious_behavior" className="text-sm">
                  Comportement suspect
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="multiple_occupants" />
                <Label htmlFor="multiple_occupants" className="text-sm">
                  Plusieurs occupants
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2 pt-4 border-t">
        <Label className="text-sm font-medium">Tolérance visuelle</Label>
        <div className="h-10 max-w-[250px]">
          <MultiSelect
            options={toleranceOptions}
            selected={getSelectedToleranceOptions()}
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
