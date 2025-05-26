import ModelTypeSelector from './model/model-type';
import ModelList from './model/model-list';

type ModelProps = {
  analysisType: string;
  setAnalysisType: (type: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: { id: string; name: string; type: string; color: string }[];
};

export default function Model({
  analysisType,
  setAnalysisType,
  selectedModel,
  setSelectedModel,
  availableModels,
}: ModelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-white rounded-lg shadow-sm">
      <ModelTypeSelector
        analysisType={analysisType}
        setAnalysisType={setAnalysisType}
      />
      <ModelList
        analysisType={analysisType}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        availableModels={availableModels}
      />
    </div>
  );
}
