import { useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MultiSelect from '@/components/multi-select.tsx';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { Label } from '@/components/ui/label.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

import {
  ageOptions,
  buildOptions,
  colors,
  genderOptions,
  hairLengthOptions,
  hairStyleOptions,
  heightOptions,
  toleranceOptions,
  vehicleTypes,
} from '../../lib/json/form-config.ts';
import {
  ForensicFormValues,
  PersonForensicFormValues,
  VehicleForensicFormValues,
} from '../../lib/types.ts';
import { useForensicForm } from '../../providers/forensic-form-context.tsx';
import ColorPicker from '../ui/color-picker.tsx';

export default function Appearances() {
  const { formMethods, subjectType } = useForensicForm();
  const { t } = useTranslation();
  const { setValue, control } = formMethods;

  const appearances = useWatch<ForensicFormValues>({
    control,
    name: 'appearances',
  });

  const tolerance = useWatch<ForensicFormValues, 'appearances.confidence'>({
    control,
    name: 'appearances.confidence',
    defaultValue: 'medium',
  });

  const toleranceLabels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
  };

  const handleChange = useCallback(
    (
      path:
        | 'appearances.gender'
        | 'appearances.seenAge'
        | 'appearances.build'
        | 'appearances.height'
        | 'appearances.hair.length'
        | 'appearances.hair.style'
        | 'appearances.hair.color'
        | 'appearances.type',
      values: string[]
    ) => {
      setValue(path, values);
    },
    [setValue]
  );

  // Create option maps for more efficient rendering
  const optionMaps = {
    gender: genderOptions.map((option) => option.value),
    age: ageOptions.map((option) => option.value),
    build: buildOptions.map((option) => option.value),
    height: heightOptions.map((option) => option.value),
    hairLength: hairLengthOptions.map((option) => option.value),
    hairStyle: hairStyleOptions.map((option) => option.value),
    vehicleTypes: vehicleTypes.map((option) => option.value),
    tolerance: toleranceOptions.map((option) => option.value),
  };

  return (
    <AccordionItem value="appearances">
      <AccordionTrigger>{t('forensic:appearances.title')}</AccordionTrigger>
      <AccordionContent>
        <ScrollArea
          className="pr-4 rounded-sm"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          {subjectType === 'person' ? (
            <div className="space-y-6">
              {/* Gender section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:appearances.gender')}
                </Label>
                <div className="h-10">
                  <MultiSelect
                    options={optionMaps.gender}
                    selected={
                      (appearances as PersonForensicFormValues['appearances'])
                        .gender || []
                    }
                    onChange={(selected) =>
                      handleChange('appearances.gender', selected)
                    }
                    placeholder="Sélectionner..."
                  />
                </div>
              </div>

              {/* Age section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:appearances.age')}
                </Label>
                <div className="h-10">
                  <MultiSelect
                    options={optionMaps.age}
                    selected={
                      (appearances as PersonForensicFormValues['appearances'])
                        .seenAge || []
                    }
                    onChange={(selected) =>
                      handleChange('appearances.seenAge', selected)
                    }
                    placeholder="Sélectionner..."
                  />
                </div>
              </div>

              {/* Build section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:appearances.build')}
                </Label>
                <div className="h-10">
                  <MultiSelect
                    options={optionMaps.build}
                    selected={
                      (appearances as PersonForensicFormValues['appearances'])
                        .build || []
                    }
                    onChange={(selected) =>
                      handleChange('appearances.build', selected)
                    }
                    placeholder="Sélectionner..."
                  />
                </div>
              </div>

              {/* Height section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:appearances.height')}
                </Label>
                <div className="h-10">
                  <MultiSelect
                    options={optionMaps.height}
                    selected={
                      (appearances as PersonForensicFormValues['appearances'])
                        .height || []
                    }
                    onChange={(selected) =>
                      handleChange('appearances.height', selected)
                    }
                    placeholder="Sélectionner..."
                  />
                </div>
              </div>

              {/* Hair section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:appearances.hair')}
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Hair Length */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {t('forensic:appearances.hair_length')}
                    </Label>
                    <div className="h-10">
                      <MultiSelect
                        options={optionMaps.hairLength}
                        selected={
                          (
                            appearances as PersonForensicFormValues['appearances']
                          ).hair?.length || []
                        }
                        onChange={(selected) =>
                          handleChange('appearances.hair.length', selected)
                        }
                        placeholder="Sélectionner..."
                      />
                    </div>
                  </div>

                  {/* Hair Style */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {t('forensic:appearances.hair_style')}
                    </Label>
                    <div className="h-10">
                      <MultiSelect
                        options={optionMaps.hairStyle}
                        selected={
                          (
                            appearances as PersonForensicFormValues['appearances']
                          ).hair?.style || []
                        }
                        onChange={(selected) =>
                          handleChange('appearances.hair.style', selected)
                        }
                        placeholder="Sélectionner..."
                      />
                    </div>
                  </div>

                  {/* Hair Color */}
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      {t('forensic:appearances.hair_color')}
                    </Label>
                    <ColorPicker
                      colors={colors}
                      name="appearances.hair.color"
                      control={control}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vehicle type */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:appearances.vehicle_type')}
                </Label>
                <div className="h-10 max-w-full">
                  <MultiSelect
                    options={optionMaps.vehicleTypes}
                    selected={
                      (appearances as VehicleForensicFormValues['appearances'])
                        .type || []
                    }
                    onChange={(selected) =>
                      handleChange('appearances.type', selected)
                    }
                    placeholder="Sélectionner..."
                  />
                </div>
              </div>

              {/* Vehicle color */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t('forensic:appearances.vehicle_color')}
                </Label>
                <div>
                  <ColorPicker
                    colors={colors}
                    name="appearances.color"
                    control={control}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">
              {t('forensic:appearances.tolerance')}
            </Label>
            <div className="h-10">
              <Select
                value={tolerance}
                onValueChange={(value) =>
                  setValue(
                    'appearances.confidence',
                    value as 'low' | 'medium' | 'high'
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t('forensic:appearances.tolerance')}
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
