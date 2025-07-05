/* eslint-disable jsx-a11y/label-has-associated-control,no-console */
import React, { useState } from 'react';

interface ImageUploaderProps {
  onUploadSuccess: (publicId: string, secureUrl: string) => void;
}

// Options de qualité disponibles
const QUALITY_OPTIONS = [
  { value: 'auto:best', label: 'Meilleure qualité' },
  { value: 'auto:good', label: 'Bonne qualité' },
  { value: 'auto:eco', label: 'Économique' },
  { value: 'auto:low', label: 'Basse qualité' },
];

// Options de largeur disponibles
const WIDTH_OPTIONS = [
  { value: '1000', label: '1000px' },
  { value: '800', label: '800px' },
  { value: '500', label: '500px' },
  { value: '300', label: '300px' },
];

export default function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<string>(QUALITY_OPTIONS[0].value);
  const [width, setWidth] = useState<string>(WIDTH_OPTIONS[0].value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'cttframeries');

    try {
      const res = await fetch(
        'https://api.cloudinary.com/v1_1/dsrrxx5yx/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await res.json();

      if (data.secure_url && data.public_id) {
        // Construire l'URL optimisée avec les paramètres de transformation
        const transformedUrl = `https://res.cloudinary.com/dsrrxx5yx/image/upload/w_${width},q_${quality},f_auto/${data.public_id}`;

        setPreview(transformedUrl);
        onUploadSuccess(data.public_id, transformedUrl);
        console.log('Image uploadée avec succès:', transformedUrl);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Erreur upload :', err);
      setError("Échec de l'upload. Vérifiez votre connexion ou votre clé.");
    } finally {
      setUploading(false);
    }
  };

  const updateTransformation = () => {
    if (preview && preview.includes('/upload/')) {
      // Extraire le public_id de l'URL existante
      const parts = preview.split('/upload/');
      if (parts.length === 2) {
        const publicIdPart = parts[1];
        const publicId = publicIdPart.includes('/')
          ? publicIdPart.substring(publicIdPart.indexOf('/') + 1)
          : publicIdPart;

        // Reconstruire l'URL avec les nouveaux paramètres
        const transformedUrl = `https://res.cloudinary.com/dsrrxx5yx/image/upload/w_${width},q_${quality},f_auto/${publicId}`;
        setPreview(transformedUrl);
        onUploadSuccess(publicId, transformedUrl);
      }
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Image (Cloudinary)
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0 file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {preview && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualité
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={quality}
                onChange={(e) => {
                  setQuality(e.target.value);
                  setTimeout(updateTransformation, 0);
                }}
              >
                {QUALITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Largeur
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  setTimeout(updateTransformation, 0);
                }}
              >
                {WIDTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <img
            src={preview}
            alt="Aperçu"
            className="mt-2 max-h-48 rounded shadow"
          />
        </div>
      )}

      {uploading && (
        <p className="text-sm text-blue-600 mt-2">Upload en cours...</p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
