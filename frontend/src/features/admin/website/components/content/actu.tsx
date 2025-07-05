import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Actualite {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  category: string;
  date: string;
  featured: boolean;
}

export default function ActualitesManager() {
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Actualite | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    content: '',
    imageUrl: '',
    category: 'Actualités',
    featured: false,
  });

  useEffect(() => {
    // Simulation de chargement des données
    const mockData: Actualite[] = [
      {
        id: '1',
        title: 'Victoire éclatante en championnat !',
        content:
          "Notre équipe première s'impose 16-2 face à Mons TTC. Une performance remarquable de tous nos joueurs qui nous place en tête du classement.",
        imageUrl: '/images/art1-JOHAN_VET.png',
        category: 'Résultats',
        date: '2024-01-15',
        featured: true,
      },
      {
        id: '2',
        title: 'Tournoi jeunes ce weekend',
        content:
          "Le tournoi annuel des jeunes aura lieu samedi et dimanche à la salle communale. Inscriptions encore possibles jusqu'à vendredi soir.",
        imageUrl: '/images/art2-SALLE.png',
        category: 'Événements',
        date: '2024-01-10',
        featured: false,
      },
      {
        id: '3',
        title: "Nouvelle table d'entraînement",
        content:
          "Le club vient d'acquérir une nouvelle table Cornilleau Competition 740 ITTF pour améliorer les conditions d'entraînement.",
        imageUrl: '/images/art3-ENZO_TRANSFERT.png',
        category: 'Équipement',
        date: '2024-01-05',
        featured: false,
      },
    ];

    setTimeout(() => {
      setActualites(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (item: Actualite) => {
    setEditingItem({ ...item });
  };

  const handleSave = () => {
    if (editingItem) {
      setActualites(
        actualites.map((item) =>
          item.id === editingItem.id ? editingItem : item
        )
      );
      setEditingItem(null);
    }
  };

  const handleCreate = () => {
    const newActualite: Actualite = {
      id: Date.now().toString(),
      ...newItem,
      date: new Date().toISOString().split('T')[0],
    };
    setActualites([newActualite, ...actualites]);
    setNewItem({
      title: '',
      content: '',
      imageUrl: '',
      category: 'Actualités',
      featured: false,
    });
  };

  const handleDelete = (id: string) => {
    if (
      // eslint-disable-next-line no-alert
      window.confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')
    ) {
      setActualites(actualites.filter((item) => item.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        Chargement des actualités...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {actualites.length}
          </div>
          <div className="text-sm text-green-700">Total actualités</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {actualites.filter((a) => a.featured).length}
          </div>
          <div className="text-sm text-yellow-700">À la une</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {
              actualites.filter(
                (a) =>
                  new Date(a.date) >
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length
            }
          </div>
          <div className="text-sm text-blue-700">Cette semaine</div>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nouvelle actualité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-title">Titre</Label>
              <Input
                id="new-title"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
                placeholder="Titre de l'actualité"
              />
            </div>
            <div>
              <Label htmlFor="new-category">Catégorie</Label>
              <Input
                id="new-category"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
                placeholder="Catégorie"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="new-content">Contenu</Label>
            <Textarea
              id="new-content"
              value={newItem.content}
              onChange={(e) =>
                setNewItem({ ...newItem, content: e.target.value })
              }
              placeholder="Contenu de l'actualité"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="new-image">URL de l&rsquo;image</Label>
            <Input
              id="new-image"
              value={newItem.imageUrl}
              onChange={(e) =>
                setNewItem({ ...newItem, imageUrl: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="new-featured"
              checked={newItem.featured}
              onChange={(e) =>
                setNewItem({ ...newItem, featured: e.target.checked })
              }
            />
            <Label htmlFor="new-featured">Mettre à la une</Label>
          </div>
          <Button onClick={handleCreate} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter l&apos;actualité
          </Button>
        </CardContent>
      </Card>

      {/* Liste des actualités */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Actualités existantes ({actualites.length})
        </h3>
        {actualites.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              {editingItem && editingItem.id === item.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Titre</Label>
                      <Input
                        value={editingItem.title}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <Input
                        value={editingItem.category}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            category: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Contenu</Label>
                    <Textarea
                      value={editingItem.content}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          content: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>URL de l&#39;image</Label>
                    <Input
                      value={editingItem.imageUrl}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          imageUrl: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingItem.featured}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          featured: e.target.checked,
                        })
                      }
                    />
                    <Label>Mettre à la une</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSave}>Enregistrer</Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingItem(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl || '/placeholder.svg'}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge variant="secondary">{item.category}</Badge>
                      {item.featured && (
                        <Badge className="bg-yellow-400 text-black">
                          À la une
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {item.content}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
