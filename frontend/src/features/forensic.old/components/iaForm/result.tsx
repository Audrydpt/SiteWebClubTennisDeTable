import { Activity, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FilePreview from './result/preview';
import AnalysisSummary from './result/summary';
import type { UploadedFile } from '../../lib/data';

type ResultProps = {
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onSwitchToConfig: () => void;
};

export default function Result({
  uploadedFiles,
  onRemoveFile,
  onSwitchToConfig,
}: ResultProps) {
  const hasAnalyzingFiles = uploadedFiles.some(
    (file) => file.status === 'analyzing'
  );
  const hasAnalyzedFiles = uploadedFiles.some(
    (file) => file.status === 'completed'
  );

  if (uploadedFiles.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <AlertCircle className="size-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Aucun résultat disponible</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Téléchargez des fichiers et lancez l&#39;analyse pour voir les
          résultats
        </p>
        <Button variant="outline" className="mt-4" onClick={onSwitchToConfig}>
          Aller à la configuration
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          Résultats d&#39;analyse
        </h3>
        {hasAnalyzingFiles && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <div className="animate-spin rounded-full size-3 border-b-2 border-current" />
            Analyse en cours
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uploadedFiles.map((file) => (
          <FilePreview key={file.id} file={file} onRemove={onRemoveFile} />
        ))}
      </div>

      {hasAnalyzedFiles && <AnalysisSummary uploadedFiles={uploadedFiles} />}
    </div>
  );
}
