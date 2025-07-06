/* eslint-disable no-console,no-alert */
import { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchActualites,
  createActualite,
  updateActualite,
  deleteActualite,
  fetchImages,
} from '@/services/api';
import { Image, ActualiteData } from '@/services/type.ts';

export default function ActualitesManager() {
  const [actualites, setActualites] = useState<ActualiteData[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [editingItem, setEditingItem] = useState<ActualiteData | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    content: '',
    imageUrl: '',
    redirectUrl: '',
    order: 0,
  });

  const loadData = async () => {
    try {
      const [actuRes, imgRes] = await Promise.all([
        fetchActualites(),
        fetchImages(),
      ]);

      // Trier les actualités par leur ordre ou id par défaut
      const sortedActualites = [...actuRes].sort(
        (a, b) => (a.order || Infinity) - (b.order || Infinity)
      );

      setActualites(sortedActualites);
      setImages(imgRes);
    } catch (err) {
      console.error('Erreur chargement des données', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!newItem.title.trim() || !newItem.imageUrl.trim()) {
      alert('Veuillez renseigner un titre et sélectionner une image.');
      return;
    }
    const newActu = {
      id: Date.now().toString(),
      ...newItem,
    };
    await createActualite(newActu);
    setNewItem({
      title: '',
      content: '',
      imageUrl: '',
      redirectUrl: '',
      order: 0,
    });
    await loadData();
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    await updateActualite(editingItem.id, editingItem);
    setEditingItem(null);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer cette actualité ?')) {
      await deleteActualite(id);
      await loadData();
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newOrder = [...actualites];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= actualites.length) return;

    // Échanger les positions
    [newOrder[index], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[index],
    ];

    // Mettre à jour les numéros d'ordre
    const updatedActualites = newOrder.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setActualites(updatedActualites);

    try {
      await Promise.all(
        updatedActualites.map(
          (item) => updateActualite(item.id, item) // Envoyer l'objet entier
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'ordre:", error);
      await loadData();
    }
  };

  if (loading) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Ajouter une actualité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                placeholder="Titre *"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
              />
              <Textarea
                placeholder="Contenu"
                value={newItem.content}
                onChange={(e) =>
                  setNewItem({ ...newItem, content: e.target.value })
                }
              />
              <Input
                placeholder="URL de redirection (optionnel)"
                value={newItem.redirectUrl}
                onChange={(e) =>
                  setNewItem({ ...newItem, redirectUrl: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <select
                value={newItem.imageUrl}
                onChange={(e) =>
                  setNewItem({ ...newItem, imageUrl: e.target.value })
                }
                className="w-full border rounded p-2"
              >
                <option value="">-- Choisir une image -- *</option>
                {images.map((img) => (
                  <option key={img.id} value={img.url}>
                    {img.label}
                  </option>
                ))}
              </select>
              {newItem.imageUrl && (
                <img
                  src={newItem.imageUrl}
                  alt="aperçu"
                  className="h-24 object-contain rounded border"
                />
              )}
            </div>
          </div>

          <Button onClick={handleCreate} className="w-full">
            Créer l&apos;actualité
          </Button>
        </CardContent>
      </Card>

      {/* Liste déroulante */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setShowList(!showList)}
          className="mx-auto"
        >
          {showList ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" /> Masquer les actualités
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" /> Voir les actualités
            </>
          )}
        </Button>
      </div>
      {showList && (
        <div className="space-y-4">
          <p>
            Premier slide <ArrowDown className="h-4 w-4" />
          </p>

          {actualites.map((actu, index) => (
            <Card key={actu.id}>
              <CardContent className="p-4">
                {editingItem?.id === actu.id ? (
                  <div className="space-y-4">
                    <Input
                      value={editingItem.title}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          title: e.target.value,
                        })
                      }
                    />
                    <Textarea
                      value={editingItem.content}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          content: e.target.value,
                        })
                      }
                    />
                    <select
                      value={editingItem.imageUrl}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          imageUrl: e.target.value,
                        })
                      }
                      className="w-full border rounded p-2"
                    >
                      <option value="">-- Choisir une image --</option>
                      {images.map((img) => (
                        <option key={img.id} value={img.url}>
                          {img.label}
                        </option>
                      ))}
                    </select>

                    <Input
                      value={editingItem.redirectUrl}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          redirectUrl: e.target.value,
                        })
                      }
                      placeholder="URL de redirection"
                    />

                    <div className="flex gap-2">
                      <Button onClick={handleUpdate}>Enregistrer</Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingItem(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    {actu.imageUrl && (
                      <img
                        src={actu.imageUrl}
                        alt={actu.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{actu.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                        {actu.content}
                      </p>
                      {actu.redirectUrl && (
                        <a
                          href={actu.redirectUrl}
                          target="_blank"
                          className="text-blue-600 text-xs underline"
                          rel="noreferrer"
                        >
                          Voir le lien
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === actualites.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setEditingItem(actu)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(actu.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
