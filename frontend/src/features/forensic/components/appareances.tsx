/* eslint-disable */
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
import { ScrollArea } from '@/components/ui/scroll-area';
import ColorPicker from './ui/color-picker';
import type { Color } from '../lib/types';

interface AppearancesProps {
  selectedClass: string;
  colors: Color[];
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  vehicleTypes: string[];
  useScrollArea?: boolean;
  maxHeight?: string;
}

export default function Appearances({
                                      selectedClass,
                                      colors,
                                      selectedColors,
                                      onColorsChange,
                                      vehicleTypes,
                                      useScrollArea = false,
                                      maxHeight = '300px',
                                    }: AppearancesProps) {
  const content = (
    <>
      {selectedClass === 'person' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Genre</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Homme</SelectItem>
                  <SelectItem value="female">Femme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Âge approximatif</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Âge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">Enfant</SelectItem>
                  <SelectItem value="adult">Adulte</SelectItem>
                  <SelectItem value="elderly">Personne âgée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Corpulence</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Corpulence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thin">Mince</SelectItem>
                <SelectItem value="average">Moyenne</SelectItem>
                <SelectItem value="athletic">Athlétique</SelectItem>
                <SelectItem value="heavy">Forte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Taille approximative
            </label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Taille" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Petite (&lt;1m65)</SelectItem>
                <SelectItem value="average">Moyenne (1m65-1m80)</SelectItem>
                <SelectItem value="tall">Grande (&gt;1m80)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Couleurs dominantes des vêtements
            </label>
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
            <label className="text-sm font-medium">
              Catégorie de véhicule
            </label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Type de véhicule" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Couleur principale</label>
            <ColorPicker
              colors={colors}
              selected={selectedColors}
              onChange={onColorsChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gabarit</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Gabarit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Petit</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="large">Grand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div className="space-y-2 pt-4 border-t">
        <label className="text-sm font-medium">Tolérance visuelle</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Niveau de tolérance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strict">Stricte</SelectItem>
            <SelectItem value="normal">Normale</SelectItem>
            <SelectItem value="flexible">Flexible</SelectItem>
          </SelectContent>
        </Select>
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