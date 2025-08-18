/* eslint-disable no-console,no-alert,no-nested-ternary */
import { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Eye,
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

// Limite de caractères réduite pour mobile (équivalent à environ une demi-page)
const MAX_CONTENT_LENGTH = 600;

// Composant d'aperçu de l'actualité
function ActualitePreview({
  title,
  content,
  imageUrl,
  redirectUrl,
}: {
  title: string;
  content: string;
  imageUrl: string;
  redirectUrl: string;
}) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Aperçu de la publication
      </h4>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm">
        {/* Simulation de l'affichage carousel */}
        <div className="relative h-32 sm:h-48 bg-black">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-contain"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
            <h5 className="font-bold text-xs sm:text-sm mb-1">
              {title || "Titre de l'actualité"}
            </h5>
            <p className="text-xs text-gray-200 line-clamp-2">
              {content
                ? content.length > 60
                  ? `${content.substring(0, 60)}...`
                  : content
                : "Contenu de l'actualité..."}
            </p>
          </div>
        </div>

        {/* Simulation de la modal - optimisée pour mobile */}
        <div className="p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-hidden">
          <h6 className="font-bold mb-2 text-sm sm:text-base">
            {title || "Titre de l'actualité"}
          </h6>
          <div className="text-xs sm:text-sm text-gray-700 space-y-1 max-h-24 sm:max-h-32 overflow-hidden">
            {content ? (
              <p className="whitespace-pre-line leading-tight">{content}</p>
            ) : (
              <p className="text-gray-400">Contenu de l&#39;actualité...</p>
            )}
          </div>
          {redirectUrl && (
            <div className="mt-2 pt-2 border-t">
              <a
                href={redirectUrl}
                className="text-blue-600 text-xs underline hover:text-blue-800 block truncate"
                title={redirectUrl}
              >
                {redirectUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
    if (newItem.content.length > MAX_CONTENT_LENGTH) {
      alert(
        `Le contenu ne peut pas dépasser ${MAX_CONTENT_LENGTH} caractères.`
      );
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
    if (editingItem.content.length > MAX_CONTENT_LENGTH) {
      alert(
        `Le contenu ne peut pas dépasser ${MAX_CONTENT_LENGTH} caractères.`
      );
      return;
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                placeholder="Titre *"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
              />

              <div className="space-y-2">
                <Label>Contenu (optimisé pour mobile)</Label>
                <Textarea
                  placeholder="Contenu de l'actualité - gardez-le court pour un affichage optimal sur mobile"
                  value={newItem.content}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (value.length <= MAX_CONTENT_LENGTH) {
                      setNewItem({ ...newItem, content: value });
                    }
                  }}
                  className="min-h-24 resize-none"
                  maxLength={MAX_CONTENT_LENGTH}
                />
                <div className="flex justify-between items-center text-sm">
                  <span
                    className={`${
                      newItem.content.length > MAX_CONTENT_LENGTH * 0.9
                        ? 'text-orange-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {newItem.content.length} / {MAX_CONTENT_LENGTH} caractères
                  </span>
                  {newItem.content.length > MAX_CONTENT_LENGTH * 0.9 && (
                    <span className="text-orange-600 text-xs">
                      Limite bientôt atteinte
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  💡 Conseil : Sur mobile, limitez-vous à 2-3 phrases courtes
                  pour un affichage optimal sans scroll
                </div>
              </div>

              <Input
                placeholder="URL de redirection (optionnel)"
                value={newItem.redirectUrl}
                onChange={(e) =>
                  setNewItem({ ...newItem, redirectUrl: e.target.value })
                }
              />

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

            {/* Aperçu en temps réel */}
            <div className="space-y-4">
              <ActualitePreview
                title={newItem.title}
                content={newItem.content}
                imageUrl={newItem.imageUrl}
                redirectUrl={newItem.redirectUrl}
              />
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                      <div className="space-y-2">
                        <Textarea
                          value={editingItem.content}
                          onChange={(e) => {
                            const { value } = e.target;
                            if (value.length <= MAX_CONTENT_LENGTH) {
                              setEditingItem({
                                ...editingItem,
                                content: value,
                              });
                            }
                          }}
                          className="min-h-24 resize-none"
                          maxLength={MAX_CONTENT_LENGTH}
                        />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">
                            {editingItem.content.length} / {MAX_CONTENT_LENGTH}{' '}
                            caractères
                          </span>
                          {editingItem.content.length >
                            MAX_CONTENT_LENGTH * 0.9 && (
                            <span className="text-orange-600 text-xs">
                              Limite bientôt atteinte
                            </span>
                          )}
                        </div>
                      </div>

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

                    {/* Aperçu pendant l'édition */}
                    <div>
                      <ActualitePreview
                        title={editingItem.title}
                        content={editingItem.content}
                        imageUrl={editingItem.imageUrl || ''}
                        redirectUrl={editingItem.redirectUrl || ''}
                      />
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
                      <p className="text-xs text-gray-400 mb-1">
                        {actu.content.length} / {MAX_CONTENT_LENGTH} caractères
                        {actu.content.length > 300 && (
                          <span className="text-orange-500 ml-1">
                            ⚠️ Peut nécessiter scroll sur mobile
                          </span>
                        )}
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
