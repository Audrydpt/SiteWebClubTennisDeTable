/* eslint-disable */
import { useState, useEffect } from 'react';
import { Save, Search } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Appearances from '@/features/forensic/components/appareances';
import Sources from '@/features/forensic/components/sources';
import Times from '@/features/forensic/components/times';
import Attributes from '@/features/forensic/components/attributes';
import Types from '@/features/forensic/components/types';
import { colors } from './lib/form-config';
import useSearch, { ForensicResult } from './hooks/use-search';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/auth-context.tsx';


// Define form schema using zod
const forensicFormSchema = z.object({
  // Basic search parameters
  date: z.string().optional(),
  endDate: z.string().optional(),
  startTime: z.string().default('00:00'),
  endTime: z.string().default('23:59'),
  cameras: z.array(z.string()).default([]),
  subjectType: z.enum(['person', 'vehicle']).default('vehicle'),

  // Appearance information
  appearance: z
    .object({
      generalColors: z.array(z.string()).default([]),
      gender: z.array(z.string()).optional(),
      age: z.array(z.string()).optional(),
      build: z.array(z.string()).optional(),
      height: z.array(z.string()).optional(),
      vehicleCategory: z.array(z.string()).optional(),
      vehicleSize: z.array(z.string()).optional(),
    })
    .default({}),

  // Attribute information
  attributes: z
    .object({
      hairColors: z.array(z.string()).optional(),
      hairLength: z.array(z.string()).optional(),
      hairStyle: z.array(z.string()).optional(),
      upperType: z.array(z.string()).optional(),
      topColors: z.array(z.string()).optional(),
      lowerType: z.array(z.string()).optional(),
      bottomColors: z.array(z.string()).optional(),
      brands: z.array(z.string()).optional(),
      models: z.array(z.string()).optional(),
      plate: z.string().optional(),
      distinctiveFeatures: z.record(z.boolean()).default({}),
      contextFeatures: z.record(z.boolean()).default({}),
    })
    .default({}),

  // Tolerance settings
  appearanceTolerance: z.array(z.string()).default([]),
  attributesTolerance: z.array(z.string()).default([]),
});

type ForensicFormValues = z.infer<typeof forensicFormSchema>;

export default function Forensic() {
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const { sessionId = '' } = useAuth();

  const {
    startSearch,
    initWebSocket,
    closeWebSocket,
    progress,
    results,
    isSearching,
  } = useSearch(sessionId);

  // Initialize form with React Hook Form
  const methods = useForm<ForensicFormValues>({
    resolver: zodResolver(forensicFormSchema),
    defaultValues: {
      subjectType: 'vehicle',
      cameras: [],
      startTime: '00:00',
      endTime: '23:59',
      appearance: {
        generalColors: [],
      },
      attributes: {
        distinctiveFeatures: {},
        contextFeatures: {},
      },
    },
  });

  // Clean up object URLs when component unmounts
  useEffect(
    () => () => {
      results.forEach((result) => {
        if (result.imageData.startsWith('blob:')) {
          URL.revokeObjectURL(result.imageData);
        }
      });
    },
    [results]
  );

  const transformColors = (colorHexes: string[]) =>
    colorHexes.map((hex) => {
      const colorObj = colors.find((c) => c.value === hex);
      return colorObj ? colorObj.name.toLowerCase() : hex;
    });

  const handleSearch = async (data: ForensicFormValues) => {
    setSearchSubmitted(true);

    // Map tolerance values
    const toleranceMap: { [key: string]: 'low' | 'medium' | 'high' } = {
      Low: 'low',
      Medium: 'medium',
      High: 'high',
    };

    // Transform form data to match API expectations
    const formattedData = {
      ...data,
      appearance: {
        ...data.appearance,
        generalColors: transformColors(data.appearance.generalColors),
      },
      attributes: {
        ...data.attributes,
        hairColors: data.attributes.hairColors
          ? transformColors(data.attributes.hairColors)
          : undefined,
        topColors: data.attributes.topColors
          ? transformColors(data.attributes.topColors)
          : undefined,
        bottomColors: data.attributes.bottomColors
          ? transformColors(data.attributes.bottomColors)
          : undefined,
      },
      appearanceTolerance:
        data.appearanceTolerance.length > 0
          ? toleranceMap[data.appearanceTolerance[0]] || 'medium'
          : 'medium',
      attributesTolerance:
        data.attributesTolerance.length > 0
          ? toleranceMap[data.attributesTolerance[0]] || 'medium'
          : 'medium',
    };

    console.log('Search form data:', JSON.stringify(formattedData, null, 2));

    try {
      const guid = await startSearch(formattedData, 5);
      initWebSocket(guid);
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-4 h-full">
      <Card className="h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Recherche vidéo</h1>
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </Button>
          </div>

          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(handleSearch)}
              className="flex flex-col h-full"
            >
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  <Accordion type="single" defaultValue="sources" collapsible>
                    <Sources
                      onSelectedCamerasChange={(cameras) =>
                        methods.setValue('cameras', cameras)
                      }
                    />
                    <Times
                      date={methods.watch('date')}
                      onDateChange={(startDate, endDate) => {
                        methods.setValue('date', startDate);
                        methods.setValue('endDate', endDate);
                      }}
                      onTimeChange={(start, end) => {
                        methods.setValue('startTime', start);
                        methods.setValue('endTime', end);
                      }}
                    />
                    <Types
                      selectedClass={methods.watch('subjectType')}
                      onClassChange={(value) =>
                        methods.setValue(
                          'subjectType',
                          value as 'person' | 'vehicle'
                        )
                      }
                    />
                    <Appearances
                      selectedClass={methods.watch('subjectType')}
                      colors={colors}
                      selectedColors={methods.watch('appearance.generalColors')}
                      onColorsChange={(colors) =>
                        methods.setValue('appearance.generalColors', colors)
                      }
                      selectedGenders={methods.watch('appearance.gender') || []}
                      onGendersChange={(values) =>
                        methods.setValue('appearance.gender', values)
                      }
                      selectedAges={methods.watch('appearance.age') || []}
                      onAgesChange={(values) =>
                        methods.setValue('appearance.age', values)
                      }
                      selectedBuilds={methods.watch('appearance.build') || []}
                      onBuildsChange={(values) =>
                        methods.setValue('appearance.build', values)
                      }
                      selectedHeights={methods.watch('appearance.height') || []}
                      onHeightsChange={(values) =>
                        methods.setValue('appearance.height', values)
                      }
                      // Hair properties moved from Attributes component
                      selectedHairColors={methods.watch('attributes.hairColors') || []}
                      onHairColorsChange={(values) =>
                        methods.setValue('attributes.hairColors', values)
                      }
                      selectedHairLength={methods.watch('attributes.hairLength') || []}
                      onHairLengthChange={(values) =>
                        methods.setValue('attributes.hairLength', values)
                      }
                      selectedHairStyle={methods.watch('attributes.hairStyle') || []}
                      onHairStyleChange={(values) =>
                        methods.setValue('attributes.hairStyle', values)
                      }
                      selectedVehicleCategories={methods.watch('appearance.vehicleCategory') || []}
                      onVehicleCategoriesChange={(values) =>
                        methods.setValue('appearance.vehicleCategory', values)
                      }
                      selectedSizes={methods.watch('appearance.vehicleSize') || []}
                      onSizesChange={(values) =>
                        methods.setValue('appearance.vehicleSize', values)
                      }
                      selectedTolerance={methods.watch('appearanceTolerance')}
                      onToleranceChange={(values) =>
                        methods.setValue('appearanceTolerance', values)
                      }
                    />
                    <Attributes
                      selectedClass={methods.watch('subjectType')}
                      colors={colors} // Add this missing prop
                      selectedTopColors={
                        methods.watch('attributes.topColors') || []
                      }
                      onTopColorsChange={(values) =>
                        methods.setValue('attributes.topColors', values)
                      }
                      selectedBottomColors={
                        methods.watch('attributes.bottomColors') || []
                      }
                      onBottomColorsChange={(values) =>
                        methods.setValue('attributes.bottomColors', values)
                      }
                      selectedTopType={
                        methods.watch('attributes.upperType') || []
                      }
                      onTopTypeChange={(values) =>
                        methods.setValue('attributes.upperType', values)
                      }
                      selectedBottomType={
                        methods.watch('attributes.lowerType') || []
                      }
                      onBottomTypeChange={(values) =>
                        methods.setValue('attributes.lowerType', values)
                      }
                      // Remove hair-related props
                      selectedBrands={methods.watch('attributes.brands') || []}
                      onBrandsChange={(values) =>
                        methods.setValue('attributes.brands', values)
                      }
                      selectedModels={methods.watch('attributes.models') || []}
                      onModelsChange={(values) =>
                        methods.setValue('attributes.models', values)
                      }
                      licensePlate={methods.watch('attributes.plate') || ''}
                      onLicensePlateChange={(value) =>
                        methods.setValue('attributes.plate', value)
                      }
                      distinctiveFeatures={
                        methods.watch('attributes.distinctiveFeatures') || {}
                      }
                      onDistinctiveFeaturesChange={(id, checked) =>
                        methods.setValue(`attributes.distinctiveFeatures.${id}`, checked)
                      }
                      contextFeatures={methods.watch('attributes.contextFeatures') || {}}
                      onContextFeaturesChange={(id, checked) =>
                        methods.setValue(`attributes.contextFeatures.${id}`, checked)
                      }
                      selectedToleranceOptions={methods.watch('attributesTolerance')}
                      onToleranceOptionsChange={(values) =>
                        methods.setValue('attributesTolerance', values)
                      }
                    />
                  </Accordion>
                </div>
              </ScrollArea>

              <div className="mt-4">
                <Button type="submit" className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Lancer la recherche
                </Button>
              </div>
            </form>
          </FormProvider>

          {isSearching && (
            <div className="mt-2">
              <Button
                onClick={closeWebSocket}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Annuler la recherche
              </Button>
              {progress !== null && (
                <Progress value={progress} className="h-2 mt-2" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Area */}
      <Card className="h-[calc(100vh-2rem)] overflow-hidden">
        <CardContent className="p-4 h-full">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Résultats de recherche</h2>
            {progress !== null && progress < 100 && (
              <div className="mt-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  Progression: {progress}%
                </p>
              </div>
            )}
          </div>

          <ScrollArea className="h-[calc(100%-3rem)]">
            {!searchSubmitted || methods.watch('cameras').length === 0 ? (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                {methods.watch('cameras').length === 0
                  ? 'Sélectionnez une ou plusieurs caméras pour commencer'
                  : "Appuyez sur 'Lancer la recherche' pour afficher les résultats"}
              </div>
            ) : isSearching ? (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                Recherche en cours...
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {results.map((result: ForensicResult) => (
                  <div
                    key={result.id}
                    className="border rounded-md overflow-hidden"
                  >
                    <img
                      src={result.imageData}
                      alt="Forensic result"
                      className="w-full h-auto"
                    />
                    <div className="p-2">
                      <p className="text-sm">
                        Time: {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                Aucun résultat trouvé
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
