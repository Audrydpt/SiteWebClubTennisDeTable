/* eslint-disable */
import React, { useEffect, useState } from "react";
import { fetchEvents, updateEvent, fetchImages } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Plus, Trash, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function GaleryManager() {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableImages, setAvailableImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    loadData();
    loadAvailableImages();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEventData(data);
    } catch (error) {
      console.error("Erreur chargement gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableImages = async () => {
    try {
      setLoadingImages(true);
      const images = await fetchImages();
      setAvailableImages(images);
    } catch (error) {
      console.error("Erreur chargement des images:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  // Gestion des éléments de la galerie
  const handleChangeGalleryItem = (id: string, field: string, value: string) => {
    setEventData((prev: any) => ({
      ...prev,
      gallery: prev.gallery.map((item: any) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddGalleryItem = () => {
    const newId = Date.now().toString();
    const newItem = {
      id: newId,
      src: "",
      title: "Nouvel élément",
      date: new Date().toISOString().split('T')[0],
      description: "",
      category: Object.keys(eventData.galleryFilters.categories)[1] || "championnat",
      tags: [],
      type: "photo",
      thumbnail: "",
      autoThumbnail: true // Nouveau champ pour les miniatures automatiques
    };
    setEventData((prev: any) => ({
      ...prev,
      gallery: [...prev.gallery, newItem],
    }));
  };

  const handleToggleAutoThumbnail = (itemId: string, checked: boolean) => {
    setEventData((prev: any) => ({
      ...prev,
      gallery: prev.gallery.map((item: any) =>
        item.id === itemId
          ? { ...item, autoThumbnail: checked, thumbnail: checked ? "" : item.thumbnail }
          : item
      ),
    }));
  };

  const getPreviewThumbnail = (item: any) => {
    console.log('Admin preview for item:', item); // Debug

    if (item.autoThumbnail !== false && item.type === 'video') {
      // Pour les vidéos Cloudinary
      if (item.src && item.src.includes('cloudinary.com') && item.src.includes('/video/upload/')) {
        return generateCloudinaryThumbnail(item.src);
      }

      // Pour les URLs YouTube
      if (item.src && (item.src.includes('youtube.com') || item.src.includes('youtu.be'))) {
        const videoId = extractYouTubeVideoId(item.src);
        if (videoId) {
          return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }

      // Pour les autres vidéos, générer une miniature personnalisée
      if (item.src) {
        return `https://via.placeholder.com/400x300/3A3A3A/F1C40F?text=${encodeURIComponent('🎥 ' + (item.title || 'Vidéo').slice(0, 15))}`;
      }

      // Si pas de src
      return '/api/placeholder/400/300';
    }

    // Pour les photos ou miniatures personnalisées
    return item.thumbnail || item.src || '/api/placeholder/400/300';
  };

  const generateCloudinaryThumbnail = (videoUrl: string) => {
    try {
      // Extraire l'URL de base et le public_id de Cloudinary
      const regex = /https:\/\/res\.cloudinary\.com\/([^\/]+)\/video\/upload\/(?:v\d+\/)?([^\.]+)\.[^\.]+$/;
      const match = videoUrl.match(regex);

      if (match) {
        const cloudName = match[1];
        const publicId = match[2];

        console.log('Admin: Cloudinary video detected:', { cloudName, publicId }); // Debug

        // Utiliser le bon cloud name depuis l'URL fournie
        return `https://res.cloudinary.com/${cloudName}/video/upload/so_0/f_jpg,q_auto,w_200,h_150,c_fill/${publicId}.jpg`;
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la miniature Cloudinary (admin):', error);
    }

    // Fallback
    return '/api/placeholder/400/300';
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== '/api/placeholder/400/300') {
      target.src = '/api/placeholder/400/300';
    }
  };

  const handleDeleteGalleryItem = (id: string) => {
    if (!confirm("Supprimer cet élément de la galerie ?")) return;
    setEventData((prev: any) => ({
      ...prev,
      gallery: prev.gallery.filter((item: any) => item.id !== id),
    }));
  };

  const handleAddTag = (itemId: string, tag: string) => {
    if (!tag.trim()) return;
    setEventData((prev: any) => ({
      ...prev,
      gallery: prev.gallery.map((item: any) =>
        item.id === itemId
          ? { ...item, tags: [...new Set([...item.tags, tag.trim()])] }
          : item
      ),
    }));
  };

  const handleRemoveTag = (itemId: string, tagToRemove: string) => {
    setEventData((prev: any) => ({
      ...prev,
      gallery: prev.gallery.map((item: any) =>
        item.id === itemId
          ? { ...item, tags: item.tags.filter((tag: string) => tag !== tagToRemove) }
          : item
      ),
    }));
  };

  // Gestion des filtres de contenu
  const handleChangeContentFilter = (index: number, field: string, value: string) => {
    setEventData((prev: any) => ({
      ...prev,
      galleryFilters: {
        ...prev.galleryFilters,
        content: prev.galleryFilters.content.map((filter: any, i: number) =>
          i === index ? { ...filter, [field]: value } : filter
        ),
      },
    }));
  };

  const handleAddContentFilter = () => {
    const newFilter = {
      key: `filter_${Date.now()}`,
      label: "Nouveau filtre",
      icon: "star",
    };
    setEventData((prev: any) => ({
      ...prev,
      galleryFilters: {
        ...prev.galleryFilters,
        content: [...prev.galleryFilters.content, newFilter],
      },
    }));
  };

  const handleDeleteContentFilter = (index: number) => {
    if (!confirm("Supprimer ce filtre de contenu ?")) return;
    setEventData((prev: any) => ({
      ...prev,
      galleryFilters: {
        ...prev.galleryFilters,
        content: prev.galleryFilters.content.filter((_: any, i: number) => i !== index),
      },
    }));
  };

  // Gestion des catégories
  const handleChangeCategoryFilter = (key: string, field: string, value: string) => {
    setEventData((prev: any) => ({
      ...prev,
      galleryFilters: {
        ...prev.galleryFilters,
        categories: {
          ...prev.galleryFilters.categories,
          [key]: {
            ...prev.galleryFilters.categories[key],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleAddCategoryFilter = () => {
    const newKey = `category_${Date.now()}`;
    setEventData((prev: any) => ({
      ...prev,
      galleryFilters: {
        ...prev.galleryFilters,
        categories: {
          ...prev.galleryFilters.categories,
          [newKey]: {
            label: "Nouvelle catégorie",
            icon: "star",
          },
        },
      },
    }));
  };

  const handleDeleteCategoryFilter = (key: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;

    // Vérifier si cette catégorie est utilisée dans la galerie
    const isUsed = eventData.gallery.some((item: any) => item.category === key);
    if (isUsed) {
      alert("Cette catégorie est utilisée dans la galerie. Impossible de la supprimer.");
      return;
    }

    setEventData((prev: any) => {
      const newCategories = { ...prev.galleryFilters.categories };
      delete newCategories[key];
      return {
        ...prev,
        galleryFilters: {
          ...prev.galleryFilters,
          categories: newCategories,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!eventData) return;
    try {
      setSaving(true);
      await updateEvent(eventData);
      alert("Galerie sauvegardée ✅");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const ImageSelector = ({ value, onChange, placeholder }: { value: string, onChange: (url: string) => void, placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Trouver l'image correspondante à l'URL actuelle
    const selectedImage = availableImages.find(img => img.url === value);

    return (
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 min-h-[40px] border rounded-md px-3 py-2 bg-gray-50 flex items-center justify-between cursor-pointer"
               onClick={() => setIsOpen(!isOpen)}>
            {selectedImage ? (
              <div className="flex items-center gap-2">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.label}
                  className="w-8 h-8 object-cover rounded"
                />
                <span className="text-sm font-medium truncate">{selectedImage.label}</span>
              </div>
            ) : (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            )}
            <Image className="w-4 h-4 text-gray-400" />
          </div>
          {value && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange("")}
              className="px-3"
            >
              ×
            </Button>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loadingImages ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                Chargement des images...
              </div>
            ) : availableImages.length === 0 ? (
              <div className="p-3 text-gray-500 text-sm">Aucune image disponible</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                {availableImages.map((img) => (
                  <div
                    key={img.id}
                    className={`cursor-pointer border-2 rounded-lg overflow-hidden hover:bg-gray-50 transition-colors ${
                      value === img.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      onChange(img.url);
                      setIsOpen(false);
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-20 object-cover"
                    />
                    <div className="p-2">
                      <div className="text-xs font-medium truncate">{img.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Chargement de la galerie...
      </div>
    );
  }

  if (!eventData) {
    return <div>Aucune donnée trouvée.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>Gestion de la Galerie</CardTitle>
            <CardDescription>
              Gérer les photos, vidéos et filtres de la galerie
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gallery" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gallery">Galerie</TabsTrigger>
              <TabsTrigger value="content">Filtres contenu</TabsTrigger>
              <TabsTrigger value="categories">Catégories</TabsTrigger>
            </TabsList>

            <TabsContent value="gallery" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Éléments de la galerie</h3>
                <Button onClick={handleAddGalleryItem} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un élément
                </Button>
              </div>

              <div className="space-y-6">
                {eventData.gallery.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg space-y-4 bg-gray-50 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.type === "photo" ? (
                          <Image className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Video className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium">{item.title}</span>
                        {/* Prévisualisation miniature */}
                        <div className="ml-4">
                          <img
                            src={getPreviewThumbnail(item)}
                            alt={`Aperçu ${item.title}`}
                            className="w-16 h-12 object-cover rounded border"
                            onError={handleImageError}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGalleryItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          handleChangeGalleryItem(item.id, "title", e.target.value)
                        }
                        placeholder="Titre"
                      />
                      <Input
                        type="date"
                        value={item.date}
                        onChange={(e) =>
                          handleChangeGalleryItem(item.id, "date", e.target.value)
                        }
                      />
                      <Select
                        value={item.category}
                        onValueChange={(val) =>
                          handleChangeGalleryItem(item.id, "category", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(eventData.galleryFilters.categories).map(
                            ([key, cat]: any) => (
                              <SelectItem key={key} value={key}>
                                {cat.label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <Select
                        value={item.type}
                        onValueChange={(val) =>
                          handleChangeGalleryItem(item.id, "type", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="photo">📸 Photo</SelectItem>
                          <SelectItem value="video">🎥 Vidéo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <ImageSelector
                      value={item.src}
                      onChange={(url) => handleChangeGalleryItem(item.id, "src", url)}
                      placeholder="URL de l'image/vidéo"
                    />

                    {item.type === "video" && (
                      <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800">Configuration vidéo</h4>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`auto-thumb-${item.id}`}
                            checked={item.autoThumbnail ?? true}
                            onCheckedChange={(checked) => handleToggleAutoThumbnail(item.id, checked)}
                          />
                          <Label htmlFor={`auto-thumb-${item.id}`} className="text-sm">
                            Miniature automatique
                          </Label>
                        </div>

                        {!item.autoThumbnail && (
                          <div>
                            <Label className="text-sm font-medium">URL miniature personnalisée</Label>
                            <ImageSelector
                              value={item.thumbnail || ""}
                              onChange={(url) => handleChangeGalleryItem(item.id, "thumbnail", url)}
                              placeholder="https://example.com/thumbnail.jpg"
                            />
                          </div>
                        )}

                        {item.autoThumbnail && (
                          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                            💡 Miniature automatique activée
                            {item.src && item.src.includes('cloudinary.com')
                              ? ' - Miniature extraite depuis Cloudinary (première frame)'
                              : item.src && (item.src.includes('youtube.com') || item.src.includes('youtu.be'))
                                ? ' - Miniature YouTube sera utilisée'
                                : item.type === 'video'
                                  ? ' - Miniature générée automatiquement'
                                  : ''}
                          </div>
                        )}

                        {!item.autoThumbnail && !item.thumbnail && (
                          <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                            ⚠️ Aucune miniature définie. Veuillez ajouter une URL de miniature ou activer la génération automatique.
                          </div>
                        )}
                      </div>
                    )}

                    <Textarea
                      value={item.description}
                      onChange={(e) =>
                        handleChangeGalleryItem(item.id, "description", e.target.value)
                      }
                      placeholder="Description"
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(item.id, tag)}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id={`tag-input-${item.id}`}
                          placeholder="Nouveau tag..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              const input = e.target as HTMLInputElement;
                              handleAddTag(item.id, input.value);
                              input.value = "";
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById(`tag-input-${item.id}`) as HTMLInputElement;
                            handleAddTag(item.id, input.value);
                            input.value = "";
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Filtres de contenu</h3>
                <Button onClick={handleAddContentFilter} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un filtre
                </Button>
              </div>

              <div className="space-y-4">
                {eventData.galleryFilters.content.map((filter: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-4 bg-gray-50 relative"
                  >
                    <button
                      onClick={() => handleDeleteContentFilter(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Clé</label>
                        <Input
                          value={filter.key}
                          onChange={(e) =>
                            handleChangeContentFilter(index, "key", e.target.value)
                          }
                          placeholder="Clé du filtre"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Label</label>
                        <Input
                          value={filter.label}
                          onChange={(e) =>
                            handleChangeContentFilter(index, "label", e.target.value)
                          }
                          placeholder="Label du filtre"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Icône</label>
                        <Select
                          value={filter.icon}
                          onValueChange={(val) =>
                            handleChangeContentFilter(index, "icon", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="star">⭐ Star</SelectItem>
                            <SelectItem value="calendar">📅 Calendar</SelectItem>
                            <SelectItem value="play">▶️ Play</SelectItem>
                            <SelectItem value="image">🖼️ Image</SelectItem>
                            <SelectItem value="video">🎥 Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Catégories</h3>
                <Button onClick={handleAddCategoryFilter} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une catégorie
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(eventData.galleryFilters.categories).map(([key, category]: any) => (
                  <div
                    key={key}
                    className="p-4 border rounded-lg space-y-4 bg-gray-50 relative"
                  >
                    <button
                      onClick={() => handleDeleteCategoryFilter(key)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Clé</label>
                        <Input
                          value={key}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Label</label>
                        <Input
                          value={category.label}
                          onChange={(e) =>
                            handleChangeCategoryFilter(key, "label", e.target.value)
                          }
                          placeholder="Label de la catégorie"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Icône</label>
                        <Select
                          value={category.icon}
                          onValueChange={(val) =>
                            handleChangeCategoryFilter(key, "icon", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trophy">🏆 Trophy</SelectItem>
                            <SelectItem value="star">⭐ Star</SelectItem>
                            <SelectItem value="calendar">📅 Calendar</SelectItem>
                            <SelectItem value="users">👥 Users</SelectItem>
                            <SelectItem value="play">▶️ Play</SelectItem>
                            <SelectItem value="heart">❤️ Heart</SelectItem>
                            <SelectItem value="flag">🚩 Flag</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}