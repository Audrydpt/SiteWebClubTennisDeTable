/* eslint-disable */
import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Eye, Camera, Video } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchImages, createImage, deleteImage } from '@/services/api';
import { Image } from '@/services/type.ts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminMedia() {
  const [images, setImages] = useState<Image[]>([]);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const imageDropRef = useRef<HTMLDivElement>(null);
  const videoDropRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');

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

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>, type: 'image' | 'video') => {
    e.preventDefault();
    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (type === 'image' && !selectedFile.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image.');
        return;
      }
      if (type === 'video' && !selectedFile.type.startsWith('video/')) {
        alert('Veuillez sélectionner un fichier vidéo.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleFileBrowse = (type: 'image' | 'video') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'video/*';
    input.onchange = (e: any) => {
      setFile(e.target.files[0]);
    };
    input.click();
  };

  const handleUpload = async (resourceType: 'image' | 'video') => {
    if (!file || !label.trim()) {
      alert(`Veuillez choisir un fichier et donner un nom à ${resourceType === 'image' ? 'l\'image' : 'la vidéo'}.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'cttframeries');

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/dsrrxx5yx/${resourceType}/upload`,
        { method: 'POST', body: formData }
      );
      const cloudData = await cloudRes.json();

      if (!cloudRes.ok) throw new Error(cloudData.error?.message);

      const newMedia = {
        label: label.trim(),
        url: optimizeCloudinaryUrl(cloudData.secure_url, resourceType),
        type: resourceType
      };

      await createImage(newMedia);
      setLabel('');
      setFile(null);
      await loadImages();
      alert(`${resourceType === 'image' ? 'Image' : 'Vidéo'} uploadée avec succès !`);
    } catch (err) {
      alert(`Erreur : ${err instanceof Error ? err.message : err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer ce média ?')) {
      await deleteImage(id);
      await loadImages();
    }
  };

  const filteredImages = images.filter((img) =>
    img.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="images" onValueChange={(val) => setActiveTab(val as 'images' | 'videos')}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Vidéos</TabsTrigger>
        </TabsList>

        {/* Formulaire d'upload d'images */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Uploader une image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <Label>Nom de l'image</Label>
                    <Input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Entrez un label pour l'image"
                    />
                  </div>

                  <div
                    ref={imageDropRef}
                    onDrop={(e) => handleFileDrop(e, 'image')}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => handleFileBrowse('image')}
                    className={clsx(
                      'border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer transition hover:bg-gray-50',
                      file && activeTab === 'images' ? 'bg-green-50 border-green-400' : ''
                    )}
                  >
                    {file && activeTab === 'images' ? (
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
                    onClick={() => handleUpload('image')}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? 'Envoi en cours...' : 'Uploader l\'image'}
                  </Button>
                </div>

                <div className="bg-gray-50 border rounded-md p-4 text-sm text-gray-700 space-y-2">
                  <h3 className="font-semibold text-base mb-2">
                    Informations image
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Taille max : <strong>10 Mo</strong>
                    </li>
                    <li>Formats recommandés :</li>
                    <ul className="list-disc list-inside ml-4">
                      <li>
                        <code>.jpg</code>, <code>.png</code>, <code>.webp</code>
                      </li>
                    </ul>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Formulaire d'upload de vidéos */}
        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Uploader une vidéo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <Label>Nom de la vidéo</Label>
                    <Input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Entrez un label pour la vidéo"
                    />
                  </div>

                  <div
                    ref={videoDropRef}
                    onDrop={(e) => handleFileDrop(e, 'video')}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => handleFileBrowse('video')}
                    className={clsx(
                      'border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer transition hover:bg-gray-50',
                      file && activeTab === 'videos' ? 'bg-green-50 border-green-400' : ''
                    )}
                  >
                    {file && activeTab === 'videos' ? (
                      <p className="text-green-600 font-medium">
                        Fichier sélectionné : {file.name}
                      </p>
                    ) : (
                      <p className="text-gray-500">
                        Glissez une vidéo ici ou{' '}
                        <span className="underline">cliquez pour parcourir</span>
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => handleUpload('video')}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? 'Envoi en cours...' : 'Uploader la vidéo'}
                  </Button>
                </div>

                <div className="bg-gray-50 border rounded-md p-4 text-sm text-gray-700 space-y-2">
                  <h3 className="font-semibold text-base mb-2">
                    Informations vidéo
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Taille max : <strong>100 Mo (+- 2.30min)</strong>
                    </li>
                    <li>Formats recommandés :</li>
                    <ul className="list-disc list-inside ml-4">
                      <li>
                        <code>.mp4</code>
                      </li>
                    </ul>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Galerie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Galerie de médias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Rechercher un nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="text-sm text-gray-500">
            {filteredImages.length} média{filteredImages.length > 1 ? 's' : ''}{' '}
            trouvé{filteredImages.length > 1 ? 's' : ''}
            {search && ` pour « ${search} »`}
          </div>

          {filteredImages.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Aucun média correspondant.
            </p>
          )}

          <ul className="divide-y divide-gray-200 border rounded-md overflow-hidden">
            {filteredImages.map((img) => (
              <li
                key={img.id}
                className="flex justify-between items-center px-4 py-2 hover:bg-gray-50 transition"
              >
                <span className="text-sm font-medium text-gray-800">
                  {img.label} {img.type === 'video' && <span className="text-xs text-blue-600 ml-2">[Vidéo]</span>}
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
            {previewImage.type === 'video' ? (
              <video
                src={previewImage.url}
                controls
                className="w-full max-h-[70vh] object-contain rounded"
              />
            ) : (
              <img
                src={previewImage.url}
                alt={previewImage.label}
                className="w-full max-h-[70vh] object-contain rounded"
              />
            )}
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

function optimizeCloudinaryUrl(url: string, resourceType: string = 'image'): string {
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  // Paramètres différents selon le type de média
  const transformations = resourceType === 'video'
    ? 'q_auto'
    : 'w_1000,q_auto,f_auto';

  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}