/* eslint-disable jsx-a11y/label-has-associated-control,react/button-has-type,no-console,no-alert */
import React, { useEffect, useState } from 'react';
import { fetchImages, createImage, Image } from '@/services/api';

interface ImageManagerProps {
  onClose: () => void;
  onNewImage: (image: Image) => void;
}

export default function ImageManager({
  onClose,
  onNewImage,
}: ImageManagerProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const loadImages = async () => {
    setLoading(true);
    try {
      const imgs = await fetchImages();
      setImages(imgs);
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default'); // ton upload preset
      // upload unsigned vers Cloudinary
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

      // création dans db.json via API (label + url)
      const newImage = { label: label.trim(), url: cloudData.secure_url };
      await createImage(newImage);

      alert('Image uploadée avec succès !');
      setLabel('');
      setFile(null);
      await loadImages();

      onNewImage(newImage as Image);
    } catch (e) {
      alert(`Erreur lors de l'upload : ${e instanceof Error ? e.message : e}`);
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Gestion des images</h2>

        {loading ? (
          <p>Chargement des images...</p>
        ) : (
          <>
            <ul className="mb-4 max-h-48 overflow-y-auto border p-2 rounded">
              {images.map((img) => (
                <li key={img.id} className="flex items-center space-x-3 mb-2">
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <span>{img.label}</span>
                </li>
              ))}
              {images.length === 0 && <li>Aucune image disponible.</li>}
            </ul>

            <div className="mb-4">
              <label className="block font-medium mb-1">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="border rounded w-full p-2"
                placeholder="Nom de l'image"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Fichier</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white"
                disabled={uploading}
              >
                Fermer
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploading ? 'Upload...' : 'Uploader'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
