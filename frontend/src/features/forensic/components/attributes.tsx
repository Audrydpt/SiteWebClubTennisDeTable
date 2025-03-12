import { useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ColorPicker from './ui/color-picker';
import MultiSelect from '@/components/multi-select';
import {
  topTypeOptions,
  bottomTypeOptions,
  toleranceOptions,
  distinctiveItems,
  contextualItems,
  colors,
} from '../lib/form-config';
import carBrands from '../lib/car-brand.json';
import {
  useForensicForm,
  PersonForensicFormValues,
  VehicleForensicFormValues,
} from '../lib/provider/forensic-form-context';

export default function Attributes() {
  const { formMethods, subjectType } = useForensicForm();
  const { watch, setValue } = formMethods;

  const toleranceLabels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
  };

  // Get attribute values from the form
  const attributes = watch('attributes') || {};
  const tolerance = attributes.confidence || 'medium';
  // Create option maps for more efficient rendering
  const optionMaps = {
    topType: topTypeOptions.map((option) => option.value),
    bottomType: bottomTypeOptions.map((option) => option.value),
    tolerance: toleranceOptions.map((option) => option.value),
    brands: carBrands.map((item) => item.brand),
  };

  // Get available models based on selected brands
  const getAvailableModels = useCallback(() => {
    if (subjectType !== 'vehicle') return [];

    const vehicleAttrs = attributes as VehicleForensicFormValues['attributes'];
    if (!vehicleAttrs.mmr?.length) return [];

    const models = new Set<string>();
    vehicleAttrs.mmr.forEach((item) => {
      const brandData = carBrands.find((b) => b.brand === item.brand);
      if (brandData) {
        brandData.models.forEach((model) => models.add(model));
      }
    });
    return Array.from(models);
  }, [subjectType, attributes]);

  // Generic handler for multi-select changes
  const handleChange = useCallback(
    (
      path:
        | 'attributes.upper.type'
        | 'attributes.upper.color'
        | 'attributes.lower.type'
        | 'attributes.lower.color',
      values: string[]
    ) => {
      if (
        path === 'attributes.upper.color' ||
        path === 'attributes.lower.color'
      ) {
        // For color paths, cast to the specific color enum type
        const typedValues = values as (
          | 'brown'
          | 'red'
          | 'orange'
          | 'yellow'
          | 'green'
          | 'cyan'
          | 'blue'
          | 'purple'
          | 'pink'
          | 'white'
          | 'gray'
          | 'black'
        )[];
        setValue(path, typedValues);
      } else if (path === 'attributes.upper.type') {
        // For upper.type, cast to the specific type enum
        const typedValues = values as (
          | 'shirt'
          | 'jacket'
          | 'coat'
          | 'sweater'
          | 'dress'
          | 'other'
        )[];
        setValue(path, typedValues);
      } else if (path === 'attributes.lower.type') {
        // For lower.type, cast to the specific type enum
        const typedValues = values as (
          | 'pants'
          | 'shorts'
          | 'skirt'
          | 'dress'
          | 'other'
        )[];
        setValue(path, typedValues);
      }
    },
    [setValue]
  );

  // Handle brands change - requires special handling for related models
  const handleBrandsChange = useCallback(
    (selected: string[]) => {
      if (subjectType === 'vehicle') {
        const vehicleAttrs =
          attributes as VehicleForensicFormValues['attributes'];
        const currentMMR = vehicleAttrs.mmr || [];
        const currentMainBrand = currentMMR[0]?.brand;
        const currentModels = currentMMR[0]?.model || [];

        // Create new MMR array with selected brands
        const mmr = selected.map((brand, index) => ({
          brand,
          model: brand === currentMainBrand && index === 0 ? currentModels : [],
        }));

        setValue('attributes.mmr', mmr);
      }
    },
    [setValue, subjectType, attributes]
  );

  // Handle models change
  const handleModelsChange = useCallback(
    (selected: string[]) => {
      if (subjectType === 'vehicle') {
        const vehicleAttrs =
          attributes as VehicleForensicFormValues['attributes'];
        if (vehicleAttrs.mmr?.length) {
          const mmr = [...vehicleAttrs.mmr];
          mmr[0] = { ...mmr[0], model: selected };
          setValue('attributes.mmr', mmr);
        }
      }
    },
    [setValue, subjectType, attributes]
  );

  // Handle checkbox changes for features
  const handleFeatureChange = useCallback(
    (id: string, checked: boolean) => {
      setValue(`attributes.other.${id}`, checked);
    },
    [setValue]
  );

  return (
    <AccordionItem value="attributes">
      <AccordionTrigger>Attributs spécifiques</AccordionTrigger>
      <AccordionContent>
        <ScrollArea
          className="pr-4 rounded-sm"
          style={{ maxHeight: '400px', overflow: 'auto' }}
        >
          {subjectType === 'person' ? (
            <div className="space-y-6">
              {/* Upper clothing section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type de haut</Label>
                  <div className="h-10 max-w-full">
                    <MultiSelect
                      options={optionMaps.topType}
                      selected={
                        (attributes as PersonForensicFormValues['attributes'])
                          .upper?.type || []
                      }
                      onChange={(selected) =>
                        handleChange('attributes.upper.type', selected)
                      }
                      placeholder="Sélectionner..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Couleur haut</Label>
                  <ColorPicker
                    colors={colors}
                    name="attributes.upper.color"
                    control={formMethods.control}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Lower clothing section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type de bas</Label>
                  <div className="h-10 max-w-full">
                    <MultiSelect
                      options={optionMaps.bottomType}
                      selected={
                        (attributes as PersonForensicFormValues['attributes'])
                          .lower?.type || []
                      }
                      onChange={(selected) =>
                        handleChange('attributes.lower.type', selected)
                      }
                      placeholder="Sélectionner..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Couleur bas</Label>
                  <ColorPicker
                    colors={colors}
                    name="attributes.lower.color"
                    control={formMethods.control}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Distinctive features section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Signes distinctifs
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {distinctiveItems.person.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={!!attributes.other?.[item.id]}
                        onCheckedChange={(checked) =>
                          handleFeatureChange(item.id, !!checked)
                        }
                      />
                      <Label htmlFor={item.id}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual items section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Contexte</Label>
                <div className="grid grid-cols-2 gap-2">
                  {contextualItems.person.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={!!attributes.other?.[item.id]}
                        onCheckedChange={(checked) =>
                          handleFeatureChange(item.id, !!checked)
                        }
                      />
                      <Label htmlFor={item.id}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vehicle brand section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Marque</Label>
                <div className="h-10 max-w-[250px]">
                  <MultiSelect
                    options={optionMaps.brands}
                    selected={(
                      (attributes as VehicleForensicFormValues['attributes'])
                        .mmr || []
                    ).map((item) => item.brand)}
                    onChange={handleBrandsChange}
                    placeholder="Sélectionner..."
                  />
                </div>
              </div>

              {/* Vehicle model section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Modèle</Label>
                <div className="h-10 max-w-[250px]">
                  <MultiSelect
                    options={getAvailableModels()}
                    selected={
                      (attributes as VehicleForensicFormValues['attributes'])
                        .mmr?.[0]?.model || []
                    }
                    onChange={handleModelsChange}
                    placeholder={
                      !(attributes as VehicleForensicFormValues['attributes'])
                        .mmr?.length
                        ? "Sélectionnez d'abord une marque"
                        : 'Sélectionner...'
                    }
                  />
                </div>
              </div>

              {/* License plate section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium" htmlFor="plate">
                  Plaque d&apos;immatriculation
                </Label>
                <div className="h-10 max-w-[250px]">
                  <Input
                    id="plate"
                    value={
                      (attributes as VehicleForensicFormValues['attributes'])
                        .plate || ''
                    }
                    onChange={(e) =>
                      setValue('attributes.plate', e.target.value)
                    }
                    placeholder="AB-123-CD"
                  />
                </div>
              </div>

              {/* Vehicle distinctive features */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Signes distinctifs
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {distinctiveItems.vehicle.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={!!attributes.other?.[item.id]}
                        onCheckedChange={(checked) =>
                          handleFeatureChange(item.id, !!checked)
                        }
                      />
                      <Label htmlFor={item.id}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle contextual items */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Contexte</Label>
                <div className="grid grid-cols-2 gap-2">
                  {contextualItems.vehicle.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={!!attributes.other?.[item.id]}
                        onCheckedChange={(checked) =>
                          handleFeatureChange(item.id, !!checked)
                        }
                      />
                      <Label htmlFor={item.id}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">Tolérance attributs</Label>
            <div className="h-10 max-w-[250px]">
              <Select
                value={tolerance}
                onValueChange={(value) =>
                  setValue(
                    'attributes.confidence',
                    value as 'low' | 'medium' | 'high'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Niveau de tolérance" />
                </SelectTrigger>
                <SelectContent>
                  {optionMaps.tolerance.map((option) => (
                    <SelectItem key={option} value={option}>
                      {toleranceLabels[option] || option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  );
}
