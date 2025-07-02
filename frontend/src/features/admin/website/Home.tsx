/* eslint-disable jsx-a11y/label-has-associated-control,no-console,no-alert */
// frontend/src/features/admin/website/Home.tsx
import React, { useEffect, useState } from 'react';
import {
  fetchTestData,
  updateTestData,
  createTestData,
  deleteTestData,
} from '@/services/api.ts';

// Interface pour les données de test
interface TestData {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Interface pour l'élément en cours d'édition
interface NewItemData {
  name: string;
  description: string;
}

export default function AdminHomePage() {
  const [testData, setTestData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<TestData | null>(null);
  const [newItem, setNewItem] = useState<NewItemData>({
    name: '',
    description: '',
  });

  // Déplacer la définition de loadData avant son utilisation
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTestData();
      setTestData(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données :', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (item: TestData) => {
    setEditingItem({ ...item });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof TestData
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
    field: keyof NewItemData
  ) => {
    setNewItem({
      ...newItem,
      [field]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await updateTestData(editingItem.id, {
          ...editingItem,
          updated_at: new Date().toISOString(),
        });
        setEditingItem(null);
        await loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
    }
  };

  const handleCreate = async () => {
    try {
      const now = new Date().toISOString();
      await createTestData({
        ...newItem,
        created_at: now,
        updated_at: now,
      });
      setNewItem({ name: '', description: '' });
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la création :', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        await deleteTestData(id);
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression :', error);
      }
    }
  };

  if (loading) {
    return <p>Chargement des données...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Administration du site</h1>

      {/* Formulaire pour ajouter un nouvel élément */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          Ajouter un nouvel élément
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
              value={newItem.name}
              onChange={(e) => handleNewItemChange(e, 'name')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label
              htmlFor="new-description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="new-description"
              value={newItem.description}
              onChange={(e) => handleNewItemChange(e, 'description')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={3}
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des éléments existants */}
      <h2 className="text-xl font-semibold mb-4">Éléments existants</h2>
      <div className="space-y-4">
        {testData.map((item) => (
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
                    value={editingItem.name}
                    onChange={(e) => handleChange(e, 'name')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`edit-description-${item.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id={`edit-description-${item.id}`}
                    value={editingItem.description}
                    onChange={(e) => handleChange(e, 'description')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
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
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <p className="mt-2">{item.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Dernière mise à jour:{' '}
                  {new Date(item.updated_at).toLocaleDateString()}
                </p>
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
