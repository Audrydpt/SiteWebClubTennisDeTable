/* eslint-disable */
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import ColorPicker from './ui/color-picker';
import type { Color } from '../lib/types';

interface AttributesProps {
  selectedClass: string;
  colors: Color[];
  tolerance: number;
  onToleranceChange: (value: number) => void;
  selectedHairColors: string[];
  onHairColorsChange: (colors: string[]) => void;
  selectedTopColors: string[];
  onTopColorsChange: (colors: string[]) => void;
  selectedBottomColors: string[];
  onBottomColorsChange: (colors: string[]) => void;
}

export default function Attributes({
  selectedClass,
  colors,
  tolerance,
  onToleranceChange,
  selectedHairColors,
  onHairColorsChange,
  selectedTopColors,
  onTopColorsChange,
  selectedBottomColors,
  onBottomColorsChange,
}: AttributesProps) {
  return (
    <AccordionItem value="attributes">
      <AccordionTrigger>Attributs spécifiques</AccordionTrigger>
      <AccordionContent>
        {selectedClass === 'person' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-medium">Cheveux</label>
              <div className="grid grid-cols-2 gap-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Longueur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Courts</SelectItem>
                    <SelectItem value="medium">Mi-longs</SelectItem>
                    <SelectItem value="long">Longs</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight">Lisses</SelectItem>
                    <SelectItem value="wavy">Ondulés</SelectItem>
                    <SelectItem value="curly">Bouclés</SelectItem>
                    <SelectItem value="bald">Chauve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Couleur des cheveux
                </label>
                <ColorPicker
                  colors={colors}
                  selected={selectedHairColors}
                  onChange={onHairColorsChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Haut</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de haut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tshirt">T-shirt</SelectItem>
                    <SelectItem value="shirt">Chemise</SelectItem>
                    <SelectItem value="sweater">Pull</SelectItem>
                    <SelectItem value="jacket">Veste</SelectItem>
                    <SelectItem value="coat">Manteau</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Couleur du haut</label>
                  <ColorPicker
                    colors={colors}
                    selected={selectedTopColors}
                    onChange={onTopColorsChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bas</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de bas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pants">Pantalon</SelectItem>
                    <SelectItem value="shorts">Short</SelectItem>
                    <SelectItem value="skirt">Jupe</SelectItem>
                    <SelectItem value="dress">Robe</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Couleur du bas</label>
                  <ColorPicker
                    colors={colors}
                    selected={selectedBottomColors}
                    onChange={onBottomColorsChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">
                Éléments distinctifs
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <Checkbox id="bag" />
                  <span className="text-sm">Sac/Bagage</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="hat" />
                  <span className="text-sm">Couvre-chef</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="glasses" />
                  <span className="text-sm">Lunettes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="mask" />
                  <span className="text-sm">Masque/Cagoule</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contexte</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <Checkbox id="group" />
                  <span className="text-sm">En groupe</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="running" />
                  <span className="text-sm">Course/Fuite</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="vehicle" />
                  <span className="text-sm">Avec véhicule</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="suspicious" />
                  <span className="text-sm">Comportement suspect</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Marque</label>
                <Input placeholder="Ex: Renault, Peugeot..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Modèle</label>
                <Input placeholder="Ex: Clio, 208..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Immatriculation</label>
                <Input placeholder="Ex: AB-123-CD" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">
                Éléments distinctifs
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <Checkbox id="damaged" />
                  <span className="text-sm">Dommages visibles</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="modified" />
                  <span className="text-sm">Modifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="tinted" />
                  <span className="text-sm">Vitres teintées</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="roof_rack" />
                  <span className="text-sm">Galerie/Coffre</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contexte</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <Checkbox id="speeding" />
                  <span className="text-sm">Vitesse excessive</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="suspicious_behavior" />
                  <span className="text-sm">Comportement suspect</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox id="multiple_occupants" />
                  <span className="text-sm">Plusieurs occupants</span>
                </label>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-2 pt-4 border-t">
          <label className="text-sm font-medium">
            Seuil de confiance minimum (%)
          </label>
          <Slider
            value={[tolerance]}
            onValueChange={([value]) => onToleranceChange(value)}
            max={100}
            step={1}
            className="py-4"
          />
          <div className="text-sm text-muted-foreground text-center">
            {tolerance}%
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
