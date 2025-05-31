import type React from 'react';

import { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UploadedFile } from '../../../lib/data';
import FilePreview from '../result/preview';

type FileUploadProps = {
  uploadedFiles: UploadedFile[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveFile: (id: string) => void;
  onRemoveAllFiles: () => void;
};

export default function FileUpload({
  uploadedFiles,
  onFileUpload,
  onDrop,
  onRemoveFile,
  onRemoveAllFiles,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        aria-label="Upload files by clicking or drag and drop"
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={onFileUpload}
          accept="image/*,video/*"
          multiple
        />
        <Upload className="size-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">
          Glissez-déposez vos fichiers ici
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          ou cliquez pour sélectionner des fichiers
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Formats supportés: JPG, PNG, MP4, MOV
        </p>
      </div>

      {/* Aperçu des fichiers téléchargés */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">
              Fichiers téléchargés ({uploadedFiles.length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={onRemoveAllFiles}
              className="flex items-center gap-1"
            >
              <Trash2 className="size-4" />
              Tout supprimer
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file) => (
              <FilePreview key={file.id} file={file} onRemove={onRemoveFile} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
