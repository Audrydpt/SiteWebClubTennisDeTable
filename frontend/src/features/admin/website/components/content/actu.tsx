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
  Archive,
  ArchiveRestore,
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
    <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
      <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Aperçu de la publication</span>
        <span className="sm:hidden">Aperçu</span>
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
        <div className="p-3 sm:p-4 max-h-32 sm:max-h-64 overflow-hidden">
          <h6 className="font-bold mb-2 text-sm sm:text-base">
            {title || "Titre de l'actualité"}
          </h6>
          <div className="text-xs sm:text-sm text-gray-700 space-y-1 max-h-16 sm:max-h-32 overflow-hidden">
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
  const [showArchived, setShowArchived] = useState(false);
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

  const handleArchive = async (id: string, archived: boolean) => {
    const actu = actualites.find((a) => a.id === id);
    if (!actu) return;

    await updateActualite(id, { ...actu, archived });
    await loadData();
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

  // Filtrer les actualités selon le statut d'archivage
  const activeActualites = actualites.filter((a) => !a.archived);
  const archivedActualites = actualites.filter((a) => a.archived);

  if (loading) {
    return (
      <div className="text-center py-6 sm:py-10 text-sm">Chargement...</div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {actualites.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {activeActualites.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                {archivedActualites.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Archivées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-purple-600">
                {images.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Images</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Ajouter une actualité</span>
            <span className="sm:hidden">Nouvelle actu</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <Input
                placeholder="Titre *"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
                className="text-sm"
              />

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">
                  Contenu (optimisé pour mobile)
                </Label>
                <Textarea
                  placeholder="Contenu de l'actualité - gardez-le court pour un affichage optimal sur mobile"
                  value={newItem.content}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (value.length <= MAX_CONTENT_LENGTH) {
                      setNewItem({ ...newItem, content: value });
                    }
                  }}
                  className="min-h-20 sm:min-h-24 resize-none text-sm"
                  maxLength={MAX_CONTENT_LENGTH}
                />
                <div className="flex justify-between items-center text-xs sm:text-sm">
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
                className="text-sm"
              />

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Image</Label>
                <select
                  value={newItem.imageUrl}
                  onChange={(e) =>
                    setNewItem({ ...newItem, imageUrl: e.target.value })
                  }
                  className="w-full border rounded p-2 text-sm"
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
                    className="h-20 sm:h-24 object-contain rounded border"
                  />
                )}
              </div>
            </div>

            {/* Aperçu en temps réel */}
            <div className="space-y-3 sm:space-y-4">
              <ActualitePreview
                title={newItem.title}
                content={newItem.content}
                imageUrl={newItem.imageUrl}
                redirectUrl={newItem.redirectUrl}
              />
            </div>
          </div>

          <Button onClick={handleCreate} className="w-full text-sm">
            Créer l&apos;actualité
          </Button>
        </CardContent>
      </Card>

      {/* Boutons de gestion des listes */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => setShowList(!showList)}
          className="text-sm"
        >
          {showList ? (
            <>
              <ChevronUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">
                Masquer les actualités actives
              </span>
              <span className="sm:hidden">Masquer actives</span>
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {activeActualites.length}
              </span>
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">
                Voir les actualités actives
              </span>
              <span className="sm:hidden">Voir actives</span>
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {activeActualites.length}
              </span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowArchived(!showArchived)}
          className="text-sm"
        >
          {showArchived ? (
            <>
              <ChevronUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">
                Masquer les actualités archivées
              </span>
              <span className="sm:hidden">Masquer archives</span>
              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                {archivedActualites.length}
              </span>
            </>
          ) : (
            <>
              <Archive className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">
                Voir les actualités archivées
              </span>
              <span className="sm:hidden">Voir archives</span>
              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                {archivedActualites.length}
              </span>
            </>
          )}
        </Button>
      </div>

      {/* Liste des actualités actives */}
      {showList && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Actualités actives
            </h3>
            <p className="text-xs sm:text-sm text-center text-gray-600">
              Premier slide{' '}
              <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1" />
            </p>
          </div>

          {activeActualites.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <p>Aucune actualité active</p>
              </CardContent>
            </Card>
          ) : (
            activeActualites.map((actu, index) => (
              <Card key={actu.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-3 sm:p-4">
                  {editingItem?.id === actu.id ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        <Input
                          value={editingItem.title}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              title: e.target.value,
                            })
                          }
                          className="text-sm"
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
                            className="min-h-20 sm:min-h-24 resize-none text-sm"
                            maxLength={MAX_CONTENT_LENGTH}
                          />
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="text-gray-500">
                              {editingItem.content.length} /{' '}
                              {MAX_CONTENT_LENGTH} caractères
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
                          className="w-full border rounded p-2 text-sm"
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
                          className="text-sm"
                        />

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button onClick={handleUpdate} className="text-sm">
                            Enregistrer
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingItem(null)}
                            className="text-sm"
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
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      {actu.imageUrl && (
                        <img
                          src={actu.imageUrl}
                          alt={actu.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 text-sm sm:text-base truncate">
                          {actu.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-1 break-words">
                          {actu.content}
                        </p>
                        <p className="text-xs text-gray-400 mb-1">
                          {actu.content.length} / {MAX_CONTENT_LENGTH}{' '}
                          caractères
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
                            className="text-blue-600 text-xs underline truncate block"
                            rel="noreferrer"
                          >
                            Voir le lien
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end shrink-0">
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8"
                            title="Monter"
                          >
                            <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === activeActualites.length - 1}
                            className="h-8 w-8"
                            title="Descendre"
                          >
                            <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setEditingItem(actu)}
                            className="h-8 w-8"
                            title="Éditer"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleArchive(actu.id, true)}
                            className="h-8 w-8 text-orange-600 hover:text-orange-700"
                            title="Archiver"
                          >
                            <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(actu.id)}
                            className="h-8 w-8"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Liste des actualités archivées */}
      {showArchived && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Archive className="h-5 w-5 text-orange-600" />
              Actualités archivées
            </h3>
          </div>

          {archivedActualites.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Archive className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune actualité archivée</p>
              </CardContent>
            </Card>
          ) : (
            archivedActualites.map((actu) => (
              <Card
                key={actu.id}
                className="border-l-4 border-l-orange-500 bg-gray-50"
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    {actu.imageUrl && (
                      <img
                        src={actu.imageUrl}
                        alt={actu.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded shrink-0 opacity-75"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm sm:text-base truncate text-gray-700">
                          {actu.title}
                        </h4>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full shrink-0">
                          Archivée
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-1 break-words">
                        {actu.content}
                      </p>
                      {actu.redirectUrl && (
                        <a
                          href={actu.redirectUrl}
                          target="_blank"
                          className="text-blue-600 text-xs underline truncate block"
                          rel="noreferrer"
                        >
                          Voir le lien
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1 sm:gap-2 items-start shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleArchive(actu.id, false)}
                        className="h-8 w-8 text-green-600 hover:text-green-700"
                        title="Restaurer"
                      >
                        <ArchiveRestore className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(actu.id)}
                        className="h-8 w-8"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
