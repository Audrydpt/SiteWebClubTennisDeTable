import {
  BarChart2,
  CheckCircle2,
  Clock,
  ImageIcon,
  Video,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import type { UploadedFile } from '../../../lib/data';

type FilePreviewProps = {
  file: UploadedFile;
  onRemove: (id: string) => void;
};

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const getFileIcon = () => {
    if (file.type === 'image') {
      return <ImageIcon className="size-5" />;
    }
    return <Video className="size-5" />;
  };

  const getStatusBadge = () => {
    switch (file.status) {
      case 'completed':
        return <Badge className="bg-primary">Terminé</Badge>;
      case 'analyzing':
        return <Badge variant="secondary">En cours</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  return (
    <div className="relative border rounded-lg overflow-hidden group">
      <div className="aspect-video bg-muted relative">
        {file.type === 'image' ? (
          <img
            src={file.preview || '/placeholder.svg'}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={file.preview}
            className="w-full h-full object-cover"
            controls
          >
            <track kind="captions" src="" label="Captions" />
          </video>
        )}
        <button
          type="button"
          className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file.id);
          }}
        >
          <X className="size-4" />
        </button>

        {file.status === 'analyzing' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full size-8 border-b-2 border-white mx-auto mb-2" />
              <p>Analyse en cours...</p>
              <p className="text-sm">{file.progress}%</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 truncate">
            {getFileIcon()}
            <span className="font-medium truncate" title={file.file.name}>
              {file.file.name.length > 20
                ? `${file.file.name.substring(0, 20)}...`
                : file.file.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {(file.file.size / (1024 * 1024)).toFixed(1)} MB
            </Badge>
            {getStatusBadge()}
          </div>
        </div>

        {file.status === 'analyzing' && (
          <Progress value={file.progress} className="h-2 mt-2" />
        )}

        {file.status === 'completed' && file.results && (
          <div className="mt-3 pt-3 border-t border-muted">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex flex-col items-center p-1 bg-muted/50 rounded">
                <BarChart2 className="size-4 mb-1 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Détections
                </span>
                <span className="font-medium">{file.results.detections}</span>
              </div>
              <div className="flex flex-col items-center p-1 bg-muted/50 rounded">
                <CheckCircle2 className="size-4 mb-1 text-primary" />
                <span className="text-xs text-muted-foreground">Confiance</span>
                <span className="font-medium">{file.results.confidence}</span>
              </div>
              <div className="flex flex-col items-center p-1 bg-muted/50 rounded">
                <Clock className="size-4 mb-1 text-primary" />
                <span className="text-xs text-muted-foreground">Temps</span>
                <span className="font-medium">
                  {file.results.processingTime}s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
