/* eslint-disable */
import { useState, useEffect } from 'react';
import {
  X,
  Filter,
  Calendar,
  Trophy,
  Users,
  Star,
  Play,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchEvents } from '@/services/api';

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  date: string;
  description: string;
  category: string;
  tags: string[];
  type: 'photo' | 'video';
  thumbnail?: string;
  autoThumbnail?: boolean;
}

interface CategoryInfo {
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface Categories {
  [key: string]: CategoryInfo;
}

export default function EventsGallery() {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [contentFilter, setContentFilter] = useState<
    'all' | 'photos' | 'videos'
  >('all');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<Categories>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleryData();
  }, []);

  const loadGalleryData = async () => {
    try {
      setLoading(true);
      const eventData = await fetchEvents();

      // Charger les données de la galerie
      setGalleryItems(eventData.gallery || []);

      // Construire les catégories dynamiquement
      const dynamicCategories: Categories = {
        all: { label: 'Tout', icon: Star, color: 'bg-gray-100 text-gray-800' },
      };

      // Ajouter les catégories depuis les données
      Object.entries(eventData.galleryFilters?.categories || {}).forEach(
        ([key, category]: [string, any]) => {
          const iconMap: { [key: string]: React.ComponentType<any> } = {
            trophy: Trophy,
            star: Star,
            calendar: Calendar,
            users: Users,
            play: Play,
          };

          dynamicCategories[key] = {
            label: category.label,
            icon: iconMap[category.icon] || Star,
            color: getCategoryColor(key),
          };
        }
      );

      setCategories(dynamicCategories);
    } catch (error) {
      console.error('Erreur lors du chargement de la galerie:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      championnat: 'bg-yellow-100 text-yellow-800',
      tournoi: 'bg-blue-100 text-blue-800',
      formation: 'bg-green-100 text-green-800',
      evenement: 'bg-purple-100 text-purple-800',
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredItems = galleryItems.filter((item) => {
    const categoryMatch =
      selectedCategory === 'all' || item.category === selectedCategory;
    const contentMatch =
      contentFilter === 'all' ||
      (contentFilter === 'photos' && item.type === 'photo') ||
      (contentFilter === 'videos' && item.type === 'video');
    return categoryMatch && contentMatch;
  });

  const stats = {
    photos: galleryItems.filter((item) => item.type === 'photo').length,
    videos: galleryItems.filter((item) => item.type === 'video').length,
  };

  const getVideoThumbnail = (item: GalleryItem) => {
    console.log('Getting thumbnail for item:', item); // Debug

    // Si autoThumbnail est false et qu'une miniature personnalisée est définie
    if (item.autoThumbnail === false && item.thumbnail) {
      return item.thumbnail;
    }

    // Si autoThumbnail est true ou undefined, essayer de générer une miniature automatique
    if (item.autoThumbnail !== false) {
      // Pour les vidéos Cloudinary
      if (item.src.includes('cloudinary.com') && item.src.includes('/video/upload/')) {
        return generateCloudinaryThumbnail(item.src);
      }

      // Pour les URLs YouTube
      if (item.src.includes('youtube.com') || item.src.includes('youtu.be')) {
        const videoId = extractYouTubeVideoId(item.src);
        if (videoId) {
          console.log('YouTube video detected, ID:', videoId); // Debug
          return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }

      // Pour les vidéos Vimeo
      if (item.src.includes('vimeo.com')) {
        return item.thumbnail || generateVideoPreview(item);
      }

      // Pour les fichiers vidéo locaux (.mp4, .webm, etc.)
      if (isVideoUrl(item.src)) {
        return generateVideoPreview(item);
      }
    }

    // Si une miniature personnalisée est définie, l'utiliser
    if (item.thumbnail) {
      return item.thumbnail;
    }

    // Fallback vers placeholder
    return generateVideoPreview(item);
  };

  const generateCloudinaryThumbnail = (videoUrl: string) => {
    try {
      // Extraire l'URL de base et le public_id de Cloudinary
      // Format: https://res.cloudinary.com/[cloud_name]/video/upload/[transformations]/[public_id].[extension]
      const regex = /https:\/\/res\.cloudinary\.com\/([^\/]+)\/video\/upload\/(?:v\d+\/)?([^\.]+)\.[^\.]+$/;
      const match = videoUrl.match(regex);

      if (match) {
        const cloudName = match[1];
        const publicId = match[2];

        console.log('Cloudinary video detected:', { cloudName, publicId }); // Debug

        // Générer l'URL de la miniature avec les transformations Cloudinary
        // so_0 = seek offset 0 (première frame)
        // f_jpg = format JPEG
        // q_auto = qualité automatique
        // w_400,h_300,c_fill = redimensionner à 400x300 avec remplissage
        return `https://res.cloudinary.com/dsrrxx5yx/video/upload/so_0/f_jpg,q_auto,w_400,h_300,c_fill/${publicId}.jpg`;
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la miniature Cloudinary:', error);
    }

    // Fallback si impossible d'extraire les informations
    return generateVideoPreview({ title: 'Vidéo', type: 'video' } as GalleryItem);
  };

  const generateVideoPreview = (item: GalleryItem) => {
    // Si c'est une vidéo, créer une miniature avec Canvas (simulation)
    // En attendant, utiliser une image de placeholder spécifique aux vidéos
    if (item.type === 'video') {
      // Utiliser l'API Placeholder avec un overlay vidéo
      return `https://via.placeholder.com/400x300/3A3A3A/F1C40F?text=${encodeURIComponent('🎥 ' + item.title.slice(0, 20))}`;
    }
    return '/api/placeholder/400/300';
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return (
      url.includes('.mp4') ||
      url.includes('.webm') ||
      url.includes('.ogg') ||
      url.includes('.mov') ||
      url.includes('.avi') ||
      url.includes('video') ||
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('vimeo.com')
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    const item = filteredItems.find(item =>
      getVideoThumbnail(item) === target.src || item.src === target.src
    );

    console.log('Image error for:', target.src, item); // Debug

    if (item && item.type === 'video') {
      // Si c'est une vidéo Cloudinary et que la miniature automatique a échoué
      if (item.src.includes('cloudinary.com') && target.src.includes('cloudinary.com')) {
        // Essayer une miniature simplifiée sans transformations complexes
        const fallbackCloudinary = item.src.replace('/video/upload/', '/video/upload/so_0,f_jpg/');
        if (target.src !== fallbackCloudinary) {
          target.src = fallbackCloudinary;
          return;
        }
      }

      // Pour les vidéos, utiliser un placeholder spécifique
      const fallbackUrl = generateVideoPreview(item);
      if (target.src !== fallbackUrl) {
        target.src = fallbackUrl;
        return;
      }
    }

    // Dernier fallback
    if (target.src !== '/api/placeholder/400/300') {
      target.src = '/api/placeholder/400/300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4 text-[#F1C40F]" />
          <p className="text-gray-600">Chargement de la galerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* HEADER */}
      <div className="relative bg-[#3A3A3A] text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute top-32 right-20 w-24 h-24 bg-[#F1C40F] rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#F1C40F] rounded-full opacity-50" />
          <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#F1C40F] rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Galerie du{' '}
            <span className="text-[#F1C40F] drop-shadow-lg">CTT Frameries</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
            Revivez les moments forts de nos compétitions et événements en
            photos et vidéos
          </p>
        </div>
      </div>

      {/* GALLERY SECTION */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
              📸 Nos Moments
            </div>
            <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
              Galerie photo et vidéo
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto mb-8">
              Revivez les moments forts de nos compétitions et événements
            </p>

            {/* --- CADRE AUTOUR DES FILTRES --- */}
            <Card className="shadow-md border border-gray-200 rounded-2xl bg-white p-6 mb-8">
              <CardContent className="p-0">
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {[
                    { key: 'all', label: 'Tout', icon: Star },
                    { key: 'photos', label: 'Photos', icon: Calendar },
                    { key: 'videos', label: 'Vidéos', icon: Play },
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={contentFilter === key ? 'default' : 'outline'}
                      onClick={() => setContentFilter(key as any)}
                      className={`transition-all duration-200 ${
                        contentFilter === key
                          ? 'bg-[#F1C40F] text-[#3A3A3A] hover:bg-[#F1C40F]/90'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                      <Badge variant="secondary" className="ml-2">
                        {key === 'all'
                          ? galleryItems.length
                          : key === 'photos'
                            ? stats.photos
                            : stats.videos}
                      </Badge>
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {Object.entries(categories).map(([key, category]) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === key;
                    return (
                      <Button
                        key={key}
                        variant={isActive ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(key)}
                        className={`transition-all duration-200 ${
                          isActive
                            ? 'bg-[#3A3A3A] text-white hover:bg-[#3A3A3A]/90'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {category.label}
                        {key !== 'all' && (
                          <Badge variant="secondary" className="ml-2">
                            {
                              galleryItems.filter((item) => item.category === key).length
                            }
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <p className="text-gray-500 mb-8">
              {filteredItems.length} élément
              {filteredItems.length > 1 ? 's' : ''}
              {selectedCategory !== 'all' &&
                ` dans la catégorie "${categories[selectedCategory]?.label || 'Inconnue'}"`}
              {contentFilter !== 'all' && ` - ${contentFilter}`}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {filteredItems.map((item, index) => {
              const categoryInfo = categories[item.category] || categories.all;
              const CategoryIcon = categoryInfo.icon;

              return (
                <Card
                  key={item.id}
                  className="group shadow-lg border-0 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer bg-white overflow-hidden w-full max-w-sm flex-shrink-0"
                  onClick={() => setSelectedItem(item)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      {item.type === 'video' ? (
                        <div className="relative">
                          <img
                            src={getVideoThumbnail(item)}
                            alt={item.title}
                            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={handleImageError}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/30" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-3 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                              <Play className="w-6 h-6 text-[#3A3A3A] fill-[#3A3A3A]" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={item.src || '/api/placeholder/400/300'}
                          alt={item.title}
                          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={handleImageError}
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className={`${categoryInfo.color} border-0`}>
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {categoryInfo.label}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3 bg-[#F1C40F] text-[#3A3A3A] px-2 py-1 rounded-full text-xs font-semibold">
                        {new Date(item.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          size="sm"
                          className="bg-white/90 text-[#3A3A3A] hover:bg-white"
                        >
                          {item.type === 'video'
                            ? 'Lire la vidéo'
                            : "Voir l'image"}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg line-clamp-2 group-hover:text-[#F1C40F] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Filter className="w-16 h-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Aucun contenu trouvé
              </h3>
              <p className="text-gray-500">
                Essayez de sélectionner une autre catégorie ou un autre filtre
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <Badge
                  className={`${categories[selectedItem.category]?.color || 'bg-gray-100 text-gray-800'} border-0`}
                >
                  {categories[selectedItem.category]?.label || 'Autre'}
                </Badge>
                {selectedItem.type === 'video' && (
                  <Badge className="bg-red-500 text-white border-0">
                    <Play className="w-4 h-4 mr-1" />
                    Vidéo
                  </Badge>
                )}
                <span className="text-white/70 text-sm">
                  {new Date(selectedItem.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="text-white hover:text-gray-300 hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <Card className="shadow-2xl border-0 bg-white">
              <CardContent className="p-0">
                {selectedItem.type === 'video' ? (
                  <div className="relative bg-black rounded-t-lg">
                    <video
                      controls
                      autoPlay
                      className="w-full max-h-[60vh] object-contain rounded-t-lg"
                      poster={getVideoThumbnail(selectedItem)}
                    >
                      <source src={selectedItem.src} type="video/mp4" />
                      <source src={selectedItem.src} type="video/webm" />
                      <source src={selectedItem.src} type="video/ogg" />
                      <p className="text-white p-4">
                        Votre navigateur ne supporte pas la lecture vidéo.
                        <a
                          href={selectedItem.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F1C40F] underline ml-2"
                        >
                          Télécharger la vidéo
                        </a>
                      </p>
                    </video>
                  </div>
                ) : (
                  <img
                    src={selectedItem.src || '/api/placeholder/400/300'}
                    alt={selectedItem.title}
                    className="w-full h-auto max-h-[60vh] object-contain rounded-t-lg"
                    onError={handleImageError}
                  />
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-3xl font-bold text-[#3A3A3A] flex-1">
                      {selectedItem.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-lg mb-4">
                    {selectedItem.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}