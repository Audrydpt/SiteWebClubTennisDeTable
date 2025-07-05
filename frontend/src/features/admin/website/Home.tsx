/* eslint-disable jsx-a11y/label-has-associated-control,no-console,no-alert */
import React, { useEffect, useState } from 'react';
import {
  fetchActualites,
  updateActualite,
  createActualite,
  deleteActualite,
} from '@/services/api.ts';
import ImageUploader from '@/features/admin/website/components/imageUploader.tsx';

// Interface pour les actualités
interface Actualite {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
}

// Interface pour une nouvelle actualité
interface NewActualite {
  title: string;
  content: string;
  imageUrl: string;
}

export default function AdminHomePage() {
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Actualite | null>(null);
  const [newItem, setNewItem] = useState<NewActualite>({
    title: '',
    content: '',
    imageUrl: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchActualites();
      setActualites(data);
    } catch (error) {
      console.error('Erreur lors du chargement des actualités :', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (item: Actualite) => {
    setEditingItem({ ...item });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof Actualite
  ) => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        [field]: e.target.value,
      });
    }
  };

  const handleNewItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof NewActualite
  ) => {
    setNewItem({
      ...newItem,
      [field]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        console.log('Mise à jour avec les données:', editingItem);
        await updateActualite(editingItem.id, editingItem);
        setEditingItem(null);
        await loadData();
        console.log('Actualité mise à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
    }
  };

  const handleCreate = async () => {
    try {
      console.log('Création avec les données:', newItem);
      await createActualite(newItem);
      setNewItem({ title: '', content: '', imageUrl: '' });
      await loadData();
      console.log('Actualité créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la création :', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')
    ) {
      try {
        await deleteActualite(id);
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression :', error);
      }
    }
  };

  if (loading) {
    return <p>Chargement des actualités...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Administration des actualités</h1>

      {/* Formulaire pour ajouter une nouvelle actualité */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          Ajouter une nouvelle actualité
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="new-title"
              className="block text-sm font-medium text-gray-700"
            >
              Titre
            </label>
            <input
              id="new-title"
              type="text"
              value={newItem.title}
              onChange={(e) => handleNewItemChange(e, 'title')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label
              htmlFor="new-content"
              className="block text-sm font-medium text-gray-700"
            >
              Contenu
            </label>
            <textarea
              id="new-content"
              value={newItem.content}
              onChange={(e) => handleNewItemChange(e, 'content')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={3}
            />
          </div>

          {/* ImageUploader intégré */}
          <ImageUploader
            onUploadSuccess={(publicId, secureUrl) => {
              console.log('Image uploadée:', publicId, 'URL:', secureUrl);
              setNewItem((prev) => ({ ...prev, imageUrl: secureUrl }));
            }}
          />

          <button
            type="button"
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des actualités existantes */}
      <h2 className="text-xl font-semibold mb-4">Actualités existantes</h2>
      <div className="space-y-4">
        {actualites.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow">
            {editingItem && editingItem.id === item.id ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor={`edit-title-${item.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Titre
                  </label>
                  <input
                    id={`edit-title-${item.id}`}
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => handleChange(e, 'title')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`edit-content-${item.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Contenu
                  </label>
                  <textarea
                    id={`edit-content-${item.id}`}
                    value={editingItem.content}
                    onChange={(e) => handleChange(e, 'content')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`edit-image-${item.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    URL de l&#39;image
                  </label>
                  <input
                    id={`edit-image-${item.id}`}
                    type="text"
                    value={editingItem.imageUrl}
                    onChange={(e) => handleChange(e, 'imageUrl')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start">
                  {item.imageUrl && (
                    <div className="mr-4 w-24">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-auto rounded"
                        onError={(e) =>
                          console.log(
                            "Erreur de chargement de l'image:",
                            e,
                            item.imageUrl
                          )
                        }
                        onLoad={() =>
                          console.log(
                            'Image chargée avec succès:',
                            item.imageUrl
                          )
                        }
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2">{item.content}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Image: {item.imageUrl ? 'Présente' : 'Aucune'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
