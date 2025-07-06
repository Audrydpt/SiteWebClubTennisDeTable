/* eslint-disable */
import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Eye, Camera } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchImages, createImage, deleteImage, Image } from '@/services/api';

export default function AdminMedia() {
  const [images, setImages] = useState<Image[]>([]);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const loadImages = async () => {
    try {
      const imgs = await fetchImages();
      setImages(imgs);
    } catch (e) {
      console.error('Erreur chargement images', e);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleFileBrowse = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      setFile(e.target.files[0]);
    };
    input.click();
  };

  const handleUpload = async () => {
    if (!file || !label.trim()) {
      alert('Veuillez choisir un fichier et donner un nom à l’image.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'cttframeries');

      const cloudRes = await fetch(
        'https://api.cloudinary.com/v1_1/dsrrxx5yx/image/upload',
        { method: 'POST', body: formData }
      );
      const cloudData = await cloudRes.json();

      if (!cloudRes.ok) throw new Error(cloudData.error?.message);

      const newImage = {
        label: label.trim(),
        url: optimizeCloudinaryUrl(cloudData.secure_url),
      };

      await createImage(newImage);
      setLabel('');
      setFile(null);
      await loadImages();
      alert('Image uploadée avec succès !');
    } catch (err) {
      alert(`Erreur : ${err instanceof Error ? err.message : err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer cette image ?')) {
      await deleteImage(id);
      await loadImages();
    }
  };

  const filteredImages = images.filter((img) =>
    img.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Uploader une image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulaire Upload */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <Label>Nom de l’image</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Entrez un label pour l'image"
                />
              </div>

              {/* Zone de drop */}
              <div
                ref={dropRef}
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={handleFileBrowse}
                className={clsx(
                  'border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer transition hover:bg-gray-50',
                  file ? 'bg-green-50 border-green-400' : ''
                )}
              >
                {file ? (
                  <p className="text-green-600 font-medium">
                    Fichier sélectionné : {file.name}
                  </p>
                ) : (
                  <p className="text-gray-500">
                    Glissez une image ici ou{' '}
                    <span className="underline">cliquez pour parcourir</span>
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? 'Envoi en cours...' : 'Uploader'}
              </Button>
            </div>

            {/* Zone d'information */}
            <div className="bg-gray-50 border rounded-md p-4 text-sm text-gray-700 space-y-2">
              <h3 className="font-semibold text-base mb-2">
                Informations fichier
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Taille max image : <strong>5 Mo</strong>
                </li>
                <li>
                  Taille max vidéo : <strong>20 Mo</strong>
                </li>
                <li>Formats recommandés :</li>
                <ul className="list-disc list-inside ml-4">
                  <li>
                    <code>.jpg</code>, <code>.png</code>, <code>.webp</code>{' '}
                    (images)
                  </li>
                  <li>
                    <code>.mp4</code> (vidéos)
                  </li>
                </ul>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Galerie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Galerie d’images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Rechercher un nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="text-sm text-gray-500">
            {filteredImages.length} image{filteredImages.length > 1 ? 's' : ''}{' '}
            trouvée
            {search && ` pour « ${search} »`}
          </div>

          {filteredImages.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Aucune image correspondante.
            </p>
          )}

          <ul className="divide-y divide-gray-200 border rounded-md overflow-hidden">
            {filteredImages.map((img) => (
              <li
                key={img.id}
                className="flex justify-between items-center px-4 py-2 hover:bg-gray-50 transition"
              >
                <span className="text-sm font-medium text-gray-800">
                  {img.label}
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setPreviewImage(img)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Modale d'aperçu */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-3">{previewImage.label}</h2>
            <img
              src={previewImage.url}
              alt={previewImage.label}
              className="w-full max-h-[70vh] object-contain rounded"
            />
            <Button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              size="icon"
              variant="ghost"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** ⬇️ Fonction utilitaire pour optimiser l'URL Cloudinary */
function optimizeCloudinaryUrl(url: string): string {
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  return `${parts[0]}/upload/w_1000,q_auto,f_auto/${parts[1]}`;
}
