/* eslint-disable react/no-array-index-key */
import { Percent, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ModelConfig } from '../../../lib/data';

type ThresholdSettingsProps = {
  config: ModelConfig;
  setConfig: (config: ModelConfig) => void;
  modelColor: string;
};

export default function ThresholdSettings({
  config,
  setConfig,
  modelColor,
}: ThresholdSettingsProps) {
  return (
    <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <Percent className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Seuils de Détection</h3>
      </div>

      {/* Improved visualization container */}
      <div className="relative h-64 mb-6 mt-4 bg-white rounded-lg p-2 shadow-inner overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
          {Array(100)
            .fill(0)
            .map((_, i) => (
              <div key={`grid-cell-${i}`} className="border border-gray-100" />
            ))}
        </div>

        {/* Center point for the circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Confidence circle - using a div with a solid background */}
          <div
            className={`absolute rounded-full ${modelColor} transition-all duration-300 ease-in-out`}
            style={{
              width: `${config.confidenceThreshold * 100}%`,
              height: `${config.confidenceThreshold * 100}%`,
              maxWidth: '100%',
              maxHeight: '100%',
              opacity: 0.25,
            }}
          />

          {/* Overlap circle - using a dashed border */}
          <div
            className="absolute rounded-full border-2 border-dashed transition-all duration-300 ease-in-out"
            style={{
              width: `${config.overlapThreshold * 100}%`,
              height: `${config.overlapThreshold * 100}%`,
              maxWidth: '100%',
              maxHeight: '100%',
              borderColor: modelColor.replace('bg-', '').split('-')[0],
            }}
          />

          {/* Indicator panel */}
          <div className="absolute text-center bg-white/90 px-4 py-3 rounded-lg shadow-md z-10">
            <div className="font-bold text-lg">
              Confiance: {(config.confidenceThreshold * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Chevauchement: {(config.overlapThreshold * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 right-2 text-xs flex flex-col gap-1 bg-white/90 p-2 rounded shadow-sm z-10">
          <div className="flex items-center gap-1">
            <div
              className={`w-3 h-3 rounded-full ${modelColor}`}
              style={{ opacity: 0.25 }}
            />
            <span>Confiance</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full border border-dashed"
              style={{
                borderColor: modelColor.replace('bg-', '').split('-')[0],
              }}
            />
            <span>Chevauchement</span>
          </div>
        </div>
      </div>

      {/* Reorganized sliders in a more graphical layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between mb-2">
            <Label
              htmlFor="confidence-threshold"
              className="font-medium flex items-center"
            >
              <div
                className={`w-3 h-3 rounded-full ${modelColor} mr-2`}
                style={{ opacity: 0.5 }}
              />
              Seuil de confiance
            </Label>
            <Badge variant="outline" className="bg-white">
              {(config.confidenceThreshold * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Certitude minimale requise pour une détection valide.
          </p>
          <div className="flex gap-4 items-center">
            <span className="text-xs text-muted-foreground">0%</span>
            <Slider
              id="confidence-threshold"
              min={0}
              max={1}
              step={0.01}
              value={[config.confidenceThreshold]}
              onValueChange={(value) =>
                setConfig({ ...config, confidenceThreshold: value[0] })
              }
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">100%</span>
            <Input
              type="number"
              value={config.confidenceThreshold}
              onChange={(e) =>
                setConfig({
                  ...config,
                  confidenceThreshold: Number.parseFloat(e.target.value) || 0.3,
                })
              }
              className="w-20"
              step={0.01}
              min={0}
              max={1}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between mb-2">
            <Label
              htmlFor="overlap-threshold"
              className="font-medium flex items-center"
            >
              <div
                className="w-3 h-3 rounded-full border border-dashed mr-2"
                style={{
                  borderColor: modelColor.replace('bg-', '').split('-')[0],
                }}
              />
              Seuil de chevauchement
            </Label>
            <Badge variant="outline" className="bg-white">
              {(config.overlapThreshold * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Chevauchement nécessaire entre deux détections.
          </p>
          <div className="flex gap-4 items-center">
            <span className="text-xs text-muted-foreground">0%</span>
            <Slider
              id="overlap-threshold"
              min={0}
              max={1}
              step={0.01}
              value={[config.overlapThreshold]}
              onValueChange={(value) =>
                setConfig({ ...config, overlapThreshold: value[0] })
              }
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">100%</span>
            <Input
              type="number"
              value={config.overlapThreshold}
              onChange={(e) =>
                setConfig({
                  ...config,
                  overlapThreshold: Number.parseFloat(e.target.value) || 0.45,
                })
              }
              className="w-20"
              step={0.01}
              min={0}
              max={1}
            />
          </div>
        </div>
      </div>

      {/* Visual explanation */}
      <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
        <h5 className="font-medium mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          Impact des seuils
        </h5>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 mb-2">
              <div
                className={`absolute inset-0 rounded-full ${modelColor}`}
                style={{ opacity: 0.1 }}
              />
              <div
                className={`absolute inset-[15%] rounded-full ${modelColor}`}
                style={{ opacity: 0.2 }}
              />
              <div
                className={`absolute inset-[30%] rounded-full ${modelColor}`}
                style={{ opacity: 0.3 }}
              />
              <div
                className={`absolute inset-[45%] rounded-full ${modelColor}`}
                style={{ opacity: 0.4 }}
              />
              <div
                className={`absolute inset-[60%] rounded-full ${modelColor}`}
                style={{ opacity: 0.5 }}
              />
            </div>
            <span className="text-sm font-medium">Confiance élevée</span>
            <span className="text-xs text-muted-foreground">
              Moins de détections mais plus précises
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 mb-2">
              <div
                className="absolute top-0 left-0 w-16 h-16 border-2 border-dashed rounded-lg"
                style={{
                  borderColor: modelColor.replace('bg-', '').split('-')[0],
                }}
              />
              <div
                className="absolute bottom-0 right-0 w-16 h-16 border-2 border-dashed rounded-lg"
                style={{
                  borderColor: modelColor.replace('bg-', '').split('-')[0],
                }}
              />
              <div className="absolute top-8 left-8 w-8 h-8 bg-primary/20 rounded-sm" />
            </div>
            <span className="text-sm font-medium">Chevauchement optimal</span>
            <span className="text-xs text-muted-foreground">
              Évite les détections dupliquées
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
