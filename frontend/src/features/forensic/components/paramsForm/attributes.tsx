import { useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MultiSelect from '@/components/multi-select.tsx';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

import carBrands from '../../lib/json/car-brand.json';
import {
  bottomTypeOptions,
  colors,
  contextualItems,
  distinctiveItems,
  toleranceOptions,
  topTypeOptions,
} from '../../lib/json/form-config.ts';
import {
  ForensicFormValues,
  PersonForensicFormValues,
  VehicleForensicFormValues,
} from '../../lib/types.ts';
import { useForensicForm } from '../../providers/forensic-form-context.tsx';
import ColorPicker from '../ui/color-picker.tsx';

export default function Attributes() {
  const { formMethods, subjectType } = useForensicForm();
  const { setValue, control } = formMethods;
  const { t } = useTranslation();

  const attributes = useWatch<ForensicFormValues, 'attributes'>({
    control,
    name: 'attributes',
  });

  const tolerance = useWatch<ForensicFormValues, 'attributes.confidence'>({
    control,
    name: 'attributes.confidence',
    defaultValue: 'medium',
  });

  const toleranceLabels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
  };

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

    // Type guard to ensure we have vehicle attributes
    if (!attributes || typeof attributes !== 'object') return [];

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
      // Type assertion with specific color types instead of any
      if (path.includes('color')) {
        setValue(
          path,
          values as Array<
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
          >
        );
      } else if (path === 'attributes.upper.type') {
        setValue(
          path,
          values as Array<
            'shirt' | 'jacket' | 'coat' | 'sweater' | 'dress' | 'other'
          >
        );
      } else if (path === 'attributes.lower.type') {
        setValue(
          path,
          values as Array<'pants' | 'shorts' | 'skirt' | 'dress' | 'other'>
        );
      }
    },
    [setValue]
  );

  // Handle brands change - requires special handling for related models
  const handleBrandsChange = useCallback(
    (selected: string[]) => {
      if (subjectType === 'vehicle' && attributes) {
        // Type guard to ensure we have vehicle attributes
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
      if (subjectType === 'vehicle' && attributes) {
        // Type guard to ensure we have vehicle attributes
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

  // Type guards for accessing attributes safely
  const personAttributes =
    subjectType === 'person' && attributes
      ? (attributes as PersonForensicFormValues['attributes'])
      : null;

  const vehicleAttributes =
    subjectType === 'vehicle' && attributes
      ? (attributes as VehicleForensicFormValues['attributes'])
      : null;

  return (
    <AccordionItem value="attributes">
      <AccordionTrigger>{t('forensic:attributes.title')}</AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="pr-4 rounded-sm pb-5">
          {subjectType === 'person' ? (
            <div className="space-y-6">
              {/* Upper clothing section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('forensic:attributes.top_type')}
                  </Label>
                  <div className="h-10 max-w-full">
                    <MultiSelect
                      options={optionMaps.topType}
                      selected={personAttributes?.upper?.type || []}
                      onChange={(selected) =>
                        handleChange('attributes.upper.type', selected)
                      }
                      placeholder="Sélectionner..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('forensic:attributes.top_color')}
                  </Label>
                  <ColorPicker
                    colors={colors}
                    name="attributes.upper.color"
                    control={control}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Lower clothing section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('forensic:attributes.bottom_type')}
                  </Label>
                  <div className="h-10 max-w-full">
                    <MultiSelect
                      options={optionMaps.bottomType}
                      selected={personAttributes?.lower?.type || []}
                      onChange={(selected) =>
                        handleChange('attributes.lower.type', selected)
                      }
                      placeholder="Sélectionner..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('forensic:attributes.bottom_color')}
                  </Label>
                  <ColorPicker
                    colors={colors}
                    name="attributes.lower.color"
                    control={control}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Distinctive features section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:attributes.distinctive_features')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {distinctiveItems.person.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={!!personAttributes?.other?.[item.id]}
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
              {/* Brand and model section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:attributes.brand')}
                </Label>
                <div className="h-10">
                  <MultiSelect
                    options={optionMaps.brands}
                    selected={
                      vehicleAttributes?.mmr?.map((item) => item.brand) || []
                    }
                    onChange={handleBrandsChange}
                    placeholder="Sélectionner..."
                  />
                </div>
              </div>

              {/* Model selection - only show if brand is selected */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:attributes.model')}
                </Label>
                <div className="h-10">
                  <MultiSelect
                    options={getAvailableModels()}
                    selected={vehicleAttributes?.mmr[0]?.model || []}
                    onChange={handleModelsChange}
                    placeholder="Sélectionner..."
                  />
                </div>
              </div>

              {/* License plate field */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:attributes.plate')}
                </Label>
                <Input
                  placeholder="AB-123-CD"
                  value={vehicleAttributes?.plate || ''}
                  onChange={(e) => setValue('attributes.plate', e.target.value)}
                  className="max-w-full"
                />
              </div>

              {/* Vehicle distinctive features */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:attributes.distinctive_features')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {distinctiveItems.vehicle.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={!!vehicleAttributes?.other?.[item.id]}
                        onCheckedChange={(checked) =>
                          handleFeatureChange(item.id, !!checked)
                        }
                      />
                      <Label htmlFor={item.id}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual situation */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:attributes.contextual_situation')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {contextualItems.vehicle.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`context-${item.id}`}
                        checked={!!vehicleAttributes?.other?.[item.id]}
                        onCheckedChange={(checked) =>
                          handleFeatureChange(item.id, !!checked)
                        }
                      />
                      <Label
                        htmlFor={`context-${item.id}`}
                        className="text-sm font-normal"
                      >
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">
              {t('forensic:attributes.tolerance')}
            </Label>
            <div className="h-10">
              <Select
                value={tolerance}
                onValueChange={(value) =>
                  setValue(
                    'attributes.confidence',
                    value as 'low' | 'medium' | 'high'
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t('forensic:attributes.tolerance')}
                  />
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
