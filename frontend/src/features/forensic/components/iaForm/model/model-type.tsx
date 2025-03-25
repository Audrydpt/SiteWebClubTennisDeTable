import { Layers } from 'lucide-react';
import { Label } from '@/components/ui/label';

type ModelTypeSelectorProps = {
  analysisType: string;
  setAnalysisType: (type: string) => void;
};

export default function ModelTypeSelector({
  analysisType,
  setAnalysisType,
}: ModelTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <Label htmlFor="analysis-type" className="text-lg font-medium">
          Type d&#39;analyse
        </Label>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div
          role="button"
          tabIndex={0}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center ${
            analysisType === 'all' || analysisType === ''
              ? 'border-gray-500 bg-gray-50'
              : 'border-muted-foreground/20 hover:border-gray-300 bg-white'
          }`}
          onClick={() => setAnalysisType('all')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setAnalysisType('all');
            }
          }}
        >
          <div className="h-3 w-3 rounded-full bg-gray-500 mb-2" />
          <span className="text-xs font-medium">Tous</span>
        </div>

        <div
          role="button"
          tabIndex={0}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center ${
            analysisType === 'action'
              ? 'border-purple-500 bg-purple-50'
              : 'border-muted-foreground/20 hover:border-purple-300 bg-white'
          }`}
          onClick={() => setAnalysisType('action')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setAnalysisType('action');
            }
          }}
        >
          <div className="h-3 w-3 rounded-full bg-purple-500 mb-2" />
          <span className="text-xs font-medium">Action</span>
        </div>

        <div
          role="button"
          tabIndex={0}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center ${
            analysisType === 'detector'
              ? 'border-blue-500 bg-blue-50'
              : 'border-muted-foreground/20 hover:border-blue-300 bg-white'
          }`}
          onClick={() => setAnalysisType('detector')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setAnalysisType('detector');
            }
          }}
        >
          <div className="h-3 w-3 rounded-full bg-blue-500 mb-2" />
          <span className="text-xs font-medium">Détecteur</span>
        </div>

        <div
          role="button"
          tabIndex={0}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center ${
            analysisType === 'classifier'
              ? 'border-green-500 bg-green-50'
              : 'border-muted-foreground/20 hover:border-green-300 bg-white'
          }`}
          onClick={() => setAnalysisType('classifier')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setAnalysisType('classifier');
            }
          }}
        >
          <div className="h-3 w-3 rounded-full bg-green-500 mb-2" />
          <span className="text-xs font-medium">Classifieur</span>
        </div>
      </div>
    </div>
  );
}
