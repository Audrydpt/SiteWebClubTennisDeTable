/* eslint-disable @typescript-eslint/no-unused-vars,no-alert */
import { useState, useEffect } from 'react';
import { Upload, Trash2, Eye, Camera } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchImages, createImage, deleteImage, Image } from '@/services/api';

export default function AdminMedia() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [totalSize, setTotalSize] = useState<string>('--');
  const [lastUpload, setLastUpload] = useState<string>('--');

  const loadImages = async () => {
    setLoading(true);
    try {
      const imgs = await fetchImages();
      setImages(imgs);

      // Calcul approximatif de la taille (simulation)
      setTotalSize(`${(imgs.length * 0.5).toFixed(1)} MB`);

      // Dernière upload
      if (imgs.length > 0) {
        const sorted = [...imgs].sort(
          (a, b) =>
            new Date(b.uploadDate || '').getTime() -
            new Date(a.uploadDate || '').getTime()
        );

        const lastDate = new Date(sorted[0].uploadDate || new Date());
        const diffDays = Math.round(
          (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
        );
        setLastUpload(`Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`);
      }
    } catch (e) {
      console.error('Erreur chargement images', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = async () => {
    if (!file || !label.trim()) {
      alert('Veuillez choisir un fichier et renseigner un label.');
      return;
    }

    setUploading(true);
    try {
      // Upload vers Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'cttframeries');

      const cloudRes = await fetch(
        'https://api.cloudinary.com/v1_1/dsrrxx5yx/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );
      const cloudData = await cloudRes.json();

      if (!cloudRes.ok) {
        throw new Error(cloudData.error?.message || 'Erreur Cloudinary');
      }

      // Création dans db.json via API
      const newImage = {
        label: label.trim(),
        url: cloudData.secure_url,
        uploadDate: new Date().toISOString().split('T')[0],
      };
      const savedImage = await createImage(newImage);

      setLabel('');
      setFile(null);
      await loadImages();
      alert('Image uploadée avec succès !');
    } catch (error) {
      alert(
        `Erreur lors de l'upload : ${error instanceof Error ? error.message : error}`
      );
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      try {
        await deleteImage(id);
        await loadImages();
      } catch (error) {
        console.error('Erreur lors de la suppression', error);
        alert("Erreur lors de la suppression de l'image");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Chargement...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Espace utilisé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSize}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Dernière upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{lastUpload}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upload d'image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Uploader une nouvelle image
          </CardTitle>
          <CardDescription>Ajoutez des images à votre galerie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="image-label">Label de l&apos;image</Label>
            <Input
              id="image-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nom de l'image"
            />
          </div>
          <div>
            <Label htmlFor="image-file">Fichier</Label>
            <Input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Upload en cours...' : "Uploader l'image"}
          </Button>
        </CardContent>
      </Card>

      {/* Galerie d'images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Galerie d&apos;images
          </CardTitle>
          <CardDescription>Gérez vos images uploadées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.id} className="border rounded-lg p-4">
                <img
                  src={img.url || '/placeholder.svg'}
                  alt={img.label}
                  className="w-full h-32 object-cover rounded mb-3"
                />
                <div className="space-y-2">
                  <h3 className="font-medium">{img.label}</h3>
                  <p className="text-xs text-gray-500">
                    {img.uploadDate
                      ? new Date(img.uploadDate).toLocaleDateString('fr-FR')
                      : 'Date inconnue'}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(img.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(img.id as string)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {images.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Aucune image disponible
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
