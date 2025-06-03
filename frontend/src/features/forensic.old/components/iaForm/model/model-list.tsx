import { Eye, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';

type ModelListProps = {
  analysisType: string;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: { id: string; name: string; type: string; color: string }[];
};

export default function ModelList({
  analysisType,
  selectedModel,
  setSelectedModel,
  availableModels,
}: ModelListProps) {
  return (
    <div className="md:col-span-3 space-y-3">
      <div className="flex items-center gap-2">
        <Eye className="size-5 text-primary" />
        <Label htmlFor="model" className="text-lg font-medium">
          Modèle
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableModels
          .filter(
            (model) =>
              analysisType === 'all' ||
              analysisType === '' ||
              model.type === analysisType
          )
          .map((model) => (
            <div
              role="button"
              tabIndex={0}
              key={model.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedModel === model.id
                  ? 'border-primary bg-primary/10'
                  : 'border-muted-foreground/20 hover:border-primary/50 bg-white'
              }`}
              onClick={() => setSelectedModel(model.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedModel(model.id);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className={`size-4 rounded-full ${model.color}`} />
                <span className="font-medium text-sm truncate">
                  {model.name}
                </span>
              </div>
            </div>
          ))}
      </div>

      {availableModels.filter(
        (model) =>
          analysisType === 'all' ||
          analysisType === '' ||
          model.type === analysisType
      ).length === 0 && (
        <div className="p-6 bg-muted/30 rounded-lg text-center">
          <AlertCircle className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Sélectionnez un type d&#39;analyse pour voir les modèles disponibles
          </p>
        </div>
      )}
    </div>
  );
}
