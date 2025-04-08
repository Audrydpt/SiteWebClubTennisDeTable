import type React from 'react';
// Types pour l'application
export type ModelType = 'detector' | 'classifier' | 'action';

export type ModelData = {
  name: string;
  model: string;
  engine: string;
  processing: { gpu: number; threads: number }[];
  networkWidth: number;
  networkHeight: number;
  defaultConfidenceThreshold: number;
  defaultOverlapThreshold: number;
  defaultComparisonMethod: string;
  filters: string[];
  type: ModelType;
};

export type ModelConfig = {
  confidenceThreshold: number;
  overlapThreshold: number;
  selectedFilters: string[];
};

export type FileStatus = 'pending' | 'analyzing' | 'completed' | 'error';

export type UploadedFile = {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  status: FileStatus;
  progress: number;
  results?: {
    detections: number;
    confidence: string;
    processingTime: string;
    detectedObjects?: { label: string; confidence: number }[];
  };
};

export type ModelSelectorProps = {
  analysisType: string;
  setAnalysisType: (type: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: { id: string; name: string; type: string; color: string }[];
};

export type FileUploadAreaProps = {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
};

export type FilePreviewProps = {
  file: UploadedFile;
  onRemove: (id: string) => void;
};

export type ThresholdSettingsProps = {
  config: ModelConfig;
  setConfig: (config: ModelConfig) => void;
  modelColor: string;
};

export type FilterSelectorProps = {
  filters: string[];
  selectedFilters: string[];
  onFilterToggle: (filter: string) => void;
};

// Données des modèles (normalement chargées depuis une API)
export const modelData: Record<string, ModelData> = {
  '/ActivityDetection_2.5.1': {
    name: 'ActivityDetection_2.5.1',
    model: 'ActivityDetection_2.5.1',
    engine: 'Darknet',
    processing: [{ gpu: 0, threads: 1 }],
    networkWidth: 640,
    networkHeight: 480,
    defaultConfidenceThreshold: 0.3,
    defaultOverlapThreshold: 0.45,
    defaultComparisonMethod: 'TopLine',
    filters: [
      'person',
      'bicycle',
      'car',
      'motorcycle',
      'bus',
      'truck',
      'backpack',
      'handbag',
      'suitcase',
      'train',
    ],
    type: 'detector',
  },
  '/ActivityE2E_3.1.0': {
    name: 'ActivityE2E_3.1.0',
    model: 'ActivityE2E_3.1.0',
    engine: 'TensorRT',
    processing: [{ gpu: 0, threads: 1 }],
    networkWidth: 1280,
    networkHeight: 736,
    defaultConfidenceThreshold: 0.3,
    defaultOverlapThreshold: 0.45,
    defaultComparisonMethod: 'TopLine',
    filters: [
      'person',
      'bicycle',
      'car',
      'motorcycle',
      'airplane',
      'bus',
      'train',
      'truck',
      'boat',
      'traffic light',
      'fire hydrant',
      'stop sign',
      'parking meter',
      'bench',
      'bird',
      'cat',
      'dog',
      'horse',
      'sheep',
      'cow',
      'elephant',
      'bear',
      'zebra',
      'giraffe',
      'backpack',
      'umbrella',
      'handbag',
      'tie',
      'suitcase',
      'frisbee',
      'skis',
      'snowboard',
      'sports ball',
      'kite',
      'baseball bat',
      'baseball glove',
      'skateboard',
      'surfboard',
      'tennis racket',
      'bottle',
      'wine glass',
      'cup',
      'fork',
      'knife',
      'spoon',
      'bowl',
      'banana',
      'apple',
      'sandwich',
      'orange',
      'broccoli',
      'carrot',
      'hot dog',
      'pizza',
      'donut',
      'cake',
      'chair',
      'couch',
      'potted plant',
      'bed',
      'dining table',
      'toilet',
      'tv',
      'laptop',
      'mouse',
      'remote',
      'keyboard',
      'cell phone',
      'microwave',
      'oven',
      'toaster',
      'sink',
      'refrigerator',
      'book',
      'clock',
      'vase',
      'scissors',
      'teddy bear',
      'hair drier',
      'toothbrush',
    ],
    type: 'detector',
  },
  '/Graffiti': {
    name: 'Graffiti',
    model: 'GraffitiE2E_3.1.0',
    engine: 'TensorRT',
    processing: [{ gpu: 0, threads: 1 }],
    networkWidth: 1280,
    networkHeight: 736,
    defaultConfidenceThreshold: 0.3,
    defaultOverlapThreshold: 0.45,
    defaultComparisonMethod: 'TopLine',
    filters: ['Graffiti'],
    type: 'detector',
  },
  '/FireSmokeE2E_3.1.0': {
    name: 'FireSmokeE2E_3.1.0',
    model: 'FireSmokeE2E_3.1.0',
    engine: 'TensorRT',
    processing: [{ gpu: 0, threads: 1 }],
    networkWidth: 640,
    networkHeight: 384,
    defaultConfidenceThreshold: 0.3,
    defaultOverlapThreshold: 0.45,
    defaultComparisonMethod: 'TopLine',
    filters: ['Fire', 'Smoke'],
    type: 'detector',
  },
  '/PPE5C': {
    name: 'PPE5C',
    model: 'PPE5CE2E_3.1.0',
    engine: 'TensorRT',
    processing: [{ gpu: 0, threads: 1 }],
    networkWidth: 1280,
    networkHeight: 736,
    defaultConfidenceThreshold: 0.3,
    defaultOverlapThreshold: 0.45,
    defaultComparisonMethod: 'TopLine',
    filters: ['person', 'vest', 'helmet', 'no_helmet', 'no_vest'],
    type: 'classifier',
  },
  '/Waste': {
    name: 'Waste',
    model: 'WasteE2E_3.1.0',
    engine: 'TensorRT',
    processing: [{ gpu: 0, threads: 1 }],
    networkWidth: 1280,
    networkHeight: 736,
    defaultConfidenceThreshold: 0.3,
    defaultOverlapThreshold: 0.45,
    defaultComparisonMethod: 'TopLine',
    filters: ['Waste'],
    type: 'classifier',
  },
  '/Activity_4.3.0': {
    name: 'Activity_4.3.0',
    model: 'Activity_4.3.0',
    engine: 'TensorRT',
    processing: [{ gpu: 0, threads: 1 }],
    networkWidth: 1280,
    networkHeight: 736,
    defaultConfidenceThreshold: 0.3,
    defaultOverlapThreshold: 0.45,
    defaultComparisonMethod: 'TopLine',
    filters: [
      'person',
      'bicycle',
      'car',
      'motorcycle',
      'bus',
      'truck',
      'traffic light',
      'backpack',
      'handbag',
      'suitcase',
    ],
    type: 'action',
  },
  '/v9-m-PCP-TRT_4.2.0': {
    name: 'v9-m-PCP-TRT_4.2.0',
    model: 'v9-m-PCP-TRT_4.2.0',
    engine: 'TensorRT',
    processing: [{ gpu: 0, threads: 1 }],
    networkWidth: 1280,
    networkHeight: 736,
    defaultConfidenceThreshold: 0.3,
    defaultOverlapThreshold: 0.45,
    defaultComparisonMethod: 'TopLine',
    filters: [
      'person',
      'backpack',
      'delivery_bag',
      'grocery_bag',
      'handbag',
      'laptop_bag',
      'music_instrument_bag',
      'plastic_bag',
      'shopping_trolley',
      'sport_bag',
      'suitcase',
      'surfboard_bag',
      'bicycle',
      'motorcycle',
      'hoverboard',
      'stroller',
      'wheelchair',
      'cardboard',
      'dogcarrier',
      'gas_cylinder',
    ],
    type: 'action',
  },
};
