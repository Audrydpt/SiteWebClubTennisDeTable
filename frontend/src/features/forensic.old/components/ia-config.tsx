/* eslint-disable prettier/prettier,no-alert */
import type React from 'react';

import { useState } from 'react';
import { Activity, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { modelData } from '../lib/data';
import type { FileStatus, ModelConfig, UploadedFile } from '../lib/data';
import Model from './iaForm/model';
import Config from './iaForm/config';
import Result from './iaForm/result';

// Modifier la fonction IAConfig pour ajouter un état initial plus complet et une meilleure présentation
export default function IAConfig() {
  // États
  const [analysisType, setAnalysisType] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [config, setConfig] = useState<ModelConfig>({
    confidenceThreshold: 0.3,
    overlapThreshold: 0.45,
    selectedFilters: [],
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<string>('config');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Convertir les données du modèle en format utilisable pour l'interface
  const availableModels = Object.entries(modelData).map(([key, value]) => ({
    id: key,
    name: `${value.name} (${value.engine})`,
    type: value.type,
    color: (() => {
      if (value.type === 'detector') return 'bg-blue-500';
      if (value.type === 'classifier') return 'bg-green-500';
      return 'bg-purple-500';
    })(),
  }));

  // Statistiques des modèles
  const modelStats = {
    total: availableModels.length,
    detectors: availableModels.filter((m) => m.type === 'detector').length,
    classifiers: availableModels.filter((m) => m.type === 'classifier').length,
    actions: availableModels.filter((m) => m.type === 'action').length,
  };

  // Mettre à jour la configuration lorsqu'un modèle est sélectionné
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setShowWelcome(false);

    // Récupérer les données du modèle sélectionné
    const model = modelData[modelId as keyof typeof modelData];
    if (model) {
      // Mettre à jour la configuration avec les valeurs par défaut du modèle
      setConfig({
        confidenceThreshold: model.defaultConfidenceThreshold,
        overlapThreshold: model.defaultOverlapThreshold,
        selectedFilters: [],
      });

      // Mettre à jour le type d'analyse si ce n'est pas "all"
      if (analysisType === 'all' || analysisType === '') {
        setAnalysisType(model.type);
      }
    }
  };

  // Obtenir la couleur pour le modèle sélectionné
  const getSelectedModelColor = () => {
    const model = availableModels.find((m) => m.id === selectedModel);
    return model ? model.color : 'bg-gray-200';
  };

  // Gérer le téléchargement de fichiers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => {
        const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const isImage = file.type.startsWith('image/');
        const preview = URL.createObjectURL(file);

        return {
          id,
          file,
          preview,
          type: isImage ? 'image' : ('video' as 'image' | 'video'),
          status: 'pending' as FileStatus,
          progress: 0,
        };
      });

      setUploadedFiles([...uploadedFiles, ...newFiles]);

      // Reset the file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Gérer le glisser-déposer
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((file) => {
        const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const isImage = file.type.startsWith('image/');
        const preview = URL.createObjectURL(file);

        return {
          id,
          file,
          preview,
          type: isImage ? 'image' : ('video' as 'image' | 'video'),
          status: 'pending' as FileStatus,
          progress: 0,
        };
      });

      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  // Supprimer un fichier
  const removeFile = (id: string) => {
    const fileToRemove = uploadedFiles.find((f) => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
  };

  // Supprimer tous les fichiers
  const removeAllFiles = () => {
    uploadedFiles.forEach((file) => {
      URL.revokeObjectURL(file.preview);
    });
    setUploadedFiles([]);
  };

  // Générer des résultats aléatoires pour la démo
  const generateRandomResults = (filter: string) => ({
    detections: Math.floor(Math.random() * 10) + 1,
    confidence: (Math.random() * 0.5 + 0.5).toFixed(2),
    processingTime: (Math.random() * 2 + 0.5).toFixed(2),
    detectedObjects: Array(Math.floor(Math.random() * 5) + 1)
      .fill(0)
      .map(() => ({
        label: filter,
        confidence: Math.random() * 0.5 + 0.5,
      })),
  });

  // Lancer l'analyse des fichiers
  const startAnalysis = () => {
    if (!selectedModel) {
      alert("Veuillez sélectionner un modèle avant de lancer l'analyse");
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Veuillez télécharger au moins un fichier à analyser');
      return;
    }

    setIsAnalyzing(true);

    // Simuler l'analyse pour chaque fichier
    const updatedFiles: UploadedFile[] = uploadedFiles.map((file) => {
      if (file.status === 'pending') {
        return {
          ...file,
          status: 'analyzing' as FileStatus,
          progress: 0,
        };
      }
      return file;
    });

    setUploadedFiles(updatedFiles);

    // Simuler la progression de l'analyse
    updatedFiles.forEach((file) => {
      if (file.status === 'analyzing') {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 10;

          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            // Sélectionner un filtre aléatoire pour les résultats
            const availableFilters =
              modelData[selectedModel as keyof typeof modelData].filters;
            const randomFilter =
              availableFilters[
                Math.floor(Math.random() * availableFilters.length)
              ];

            // In the startAnalysis function, fix the indentation:
            setUploadedFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === file.id
                  ? {
                    ...f,
                    status: 'completed' as FileStatus,
                    progress: 100,
                    results: generateRandomResults(randomFilter),
                  }
                  : f
              )
            );

            // Vérifier si tous les fichiers ont été analysés
            const allCompleted = updatedFiles.every(
              (f) => f.id === file.id || f.status === 'completed'
            );
            if (allCompleted) {
              setIsAnalyzing(false);
              setActiveTab('results');
            }
          } else {
            // Mettre à jour la progression
            setUploadedFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === file.id ? { ...f, progress: Math.round(progress) } : f
              )
            );
          }
        }, 500);
      }
    });
  };

  const switchToConfigTab = () => {
    setActiveTab('config');
  };

  return (
    <Card className="min-h-[calc(100vh-120px)]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            Interface d&apos;analyse IA
          </CardTitle>
          <Badge variant="outline" className="gap-1 text-xs">
            <Settings className="size-3" />
            {modelStats.total} modèles disponibles
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="size-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Activity className="size-4" />
              Résultats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-8">
            {/* Introduction et explication de l'interface */}
            {showWelcome && (
              <div className="bg-muted/30 p-6 rounded-lg mb-8">
                <h2 className="text-xl font-bold mb-3">
                  Bienvenue dans l&apos;interface d&apos;analyse IA
                </h2>
                <p className="mb-4">
                  Cet outil vous permet d&apos;utiliser des modèles
                  d&apos;intelligence artificielle pour effectuer l&apos;analyse
                  d&apos;actions et d&apos;objets dans vos fichiers multimédias.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-xs">
                    <div className="size-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mb-2">
                      1
                    </div>
                    <h3 className="font-medium mb-1">Sélectionnez un modèle</h3>
                    <p className="text-sm text-muted-foreground">
                      Choisissez parmi des détecteurs, classifieurs ou modèles
                      d&apos;actions
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-xs">
                    <div className="size-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mb-2">
                      2
                    </div>
                    <h3 className="font-medium mb-1">
                      Configurez les paramètres
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ajustez les seuils et filtres selon vos besoins
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-xs">
                    <div className="size-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mb-2">
                      3
                    </div>
                    <h3 className="font-medium mb-1">Lancez l&apos;analyse</h3>
                    <p className="text-sm text-muted-foreground">
                      Téléchargez vos fichiers et observez les résultats
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sélection du modèle */}
            <Model
              analysisType={analysisType}
              setAnalysisType={setAnalysisType}
              selectedModel={selectedModel}
              setSelectedModel={handleModelChange}
              availableModels={availableModels}
            />

            {/* Configuration */}
            <Config
              selectedModel={selectedModel}
              config={config}
              setConfig={setConfig}
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              onDrop={handleDrop}
              onRemoveFile={removeFile}
              onRemoveAllFiles={removeAllFiles}
              onStartAnalysis={startAnalysis}
              isAnalyzing={isAnalyzing}
              modelColor={getSelectedModelColor()}
            />
          </TabsContent>

          <TabsContent value="results">
            <Result
              uploadedFiles={uploadedFiles}
              onRemoveFile={removeFile}
              onSwitchToConfig={switchToConfigTab}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
