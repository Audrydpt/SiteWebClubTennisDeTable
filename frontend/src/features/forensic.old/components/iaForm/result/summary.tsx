import type { UploadedFile } from '../../../lib/data';

type AnalysisSummaryProps = {
  uploadedFiles: UploadedFile[];
};

export default function AnalysisSummary({
  uploadedFiles,
}: AnalysisSummaryProps) {
  const completedFiles = uploadedFiles.filter((f) => f.status === 'completed');

  const totalDetections = uploadedFiles
    .filter((f) => f.status === 'completed' && f.results)
    .reduce((acc, file) => acc + (file.results?.detections || 0), 0);

  const averageProcessingTime = (
    uploadedFiles
      .filter((f) => f.status === 'completed' && f.results)
      .reduce(
        (acc, file) =>
          acc + Number.parseFloat(file.results?.processingTime || '0'),
        0
      ) / Math.max(1, completedFiles.length)
  ).toFixed(2);

  return (
    <div className="mt-8 p-4 bg-muted/30 rounded-lg">
      <h4 className="font-medium mb-2">Résumé de l&#39;analyse</h4>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded-lg shadow-xs">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {completedFiles.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Fichiers analysés
            </div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-xs">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {totalDetections}
            </div>
            <div className="text-sm text-muted-foreground">Objets détectés</div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-xs">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {averageProcessingTime}s
            </div>
            <div className="text-sm text-muted-foreground">Temps moyen</div>
          </div>
        </div>
      </div>
    </div>
  );
}
