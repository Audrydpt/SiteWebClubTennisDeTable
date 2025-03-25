/* eslint-disable */
import type React from 'react';

import { FileSymlink, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThresholdSettings from './config/threshold-settings';
import FilterSelector from './config/filter-selector';
import FileUpload from './config/file-upload';
import type { ModelConfig, UploadedFile } from '../../lib/data';
import { modelData } from '../../lib/data';

type ConfigProps = {
  selectedModel: string;
  config: ModelConfig;
  setConfig: (
    config: ModelConfig | ((prev: ModelConfig) => ModelConfig)
  ) => void;
  uploadedFiles: UploadedFile[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveFile: (id: string) => void;
  onRemoveAllFiles: () => void;
  onStartAnalysis: () => void;
  isAnalyzing: boolean;
  modelColor: string;
};

export default function Config({
  selectedModel,
  config,
  setConfig,
  uploadedFiles,
  onFileUpload,
  onDrop,
  onRemoveFile,
  onRemoveAllFiles,
  onStartAnalysis,
  isAnalyzing,
  modelColor,
}: ConfigProps) {
  const handleFilterToggle = (filter: string) => {
    setConfig((prev: ModelConfig) => {
      if (prev.selectedFilters.includes(filter)) {
        return {
          ...prev,
          selectedFilters: prev.selectedFilters.filter(
            (f: string) => f !== filter
          ),
        };
      }
      return {
        ...prev,
        selectedFilters: [...prev.selectedFilters, filter],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Paramètres de configuration */}
      <div>
        <ThresholdSettings
          config={config}
          setConfig={setConfig}
          modelColor={modelColor}
        />
      </div>

      {/* Filtres */}
      {selectedModel &&
        modelData[selectedModel as keyof typeof modelData]?.filters && (
          <FilterSelector
            filters={modelData[selectedModel as keyof typeof modelData].filters}
            selectedFilters={config.selectedFilters}
            onFilterToggle={handleFilterToggle}
          />
        )}

      {/* Zone de téléchargement */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <FileSymlink className="h-5 w-5 text-primary" />
          Fichiers à analyser
        </h3>

        <FileUpload
          uploadedFiles={uploadedFiles}
          onFileUpload={onFileUpload}
          onDrop={onDrop}
          onRemoveFile={onRemoveFile}
          onRemoveAllFiles={onRemoveAllFiles}
        />
      </div>

      {/* Bouton d'action */}
      <div className="flex justify-end mt-8">
        <Button
          onClick={onStartAnalysis}
          className="flex items-center gap-2 px-6 py-6 text-lg"
          size="lg"
          disabled={!selectedModel || uploadedFiles.length === 0 || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin mr-2 h-5 w-5 border-2 border-b-transparent rounded-full" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Lancer l&apos;analyse
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
