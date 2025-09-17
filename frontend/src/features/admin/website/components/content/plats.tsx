/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plat } from '@/services/type';
import { fetchPlats, createPlat, updatePlat, deletePlat } from '@/services/api';

export default function PlatsManager() {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlat, setEditingPlat] = useState<Plat | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    disponible: true,
    allergenes: '',
    categorie: 'plat' as 'entree' | 'plat' | 'dessert' | 'boisson',
  });

  useEffect(() => {
    loadPlats();
  }, []);

  const loadPlats = async () => {
    setLoading(true);
    try {
      const data = await fetchPlats();
      setPlats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des plat:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prix: '',
      disponible: true,
      allergenes: '',
      categorie: 'plat',
    });
    setEditingPlat(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const platData = {
        ...formData,
        prix: parseFloat(formData.prix),
        allergenes: formData.allergenes
          ? formData.allergenes.split(',').map(a => a.trim()).filter(a => a)
          : undefined,
        dateCreation: editingPlat ? editingPlat.dateCreation : new Date().toISOString(),
      };

      if (editingPlat) {
        await updatePlat(editingPlat.id, { ...editingPlat, ...platData });
      } else {
        await createPlat(platData);
      }

      await loadPlats();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (plat: Plat) => {
    setEditingPlat(plat);
    setFormData({
      nom: plat.nom,
      description: plat.description || '',
      prix: plat.prix.toString(),
      disponible: plat.disponible,
      allergenes: plat.allergenes ? plat.allergenes.join(', ') : '',
      categorie: plat.categorie,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      try {
        await deletePlat(id);
        await loadPlats();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getCategorieColor = (categorie: string) => {
    switch (categorie) {
      case 'entree': return 'bg-green-100 text-green-800';
      case 'plat': return 'bg-blue-100 text-blue-800';
      case 'dessert': return 'bg-pink-100 text-pink-800';
      case 'boisson': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case 'entree': return 'Entrée';
      case 'plat': return 'Plat';
      case 'dessert': return 'Dessert';
      case 'boisson': return 'Boisson';
      default: return categorie;
    }
  };

  const filteredPlats = plats.filter((plat) => {
    const matchesSearch = plat.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || plat.categorie === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: plats.length,
    disponibles: plats.filter(p => p.disponible).length,
    entrees: plats.filter(p => p.categorie === 'entree').length,
    plats: plats.filter(p => p.categorie === 'plat').length,
    desserts: plats.filter(p => p.categorie === 'dessert').length,
    boissons: plats.filter(p => p.categorie === 'boisson').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête avec statistiques responsive */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
              <p className="text-xs sm:text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.disponibles}</p>
              <p className="text-xs sm:text-sm text-gray-600">Disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.entrees}</p>
              <p className="text-xs sm:text-sm text-gray-600">Entrées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.plats}</p>
              <p className="text-xs sm:text-sm text-gray-600">Plats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-pink-600">{stats.desserts}</p>
              <p className="text-xs sm:text-sm text-gray-600">Desserts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.boissons}</p>
              <p className="text-xs sm:text-sm text-gray-600">Boissons</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des plats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-lg sm:text-xl">
              <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Gestion des plats</span>
              <span className="sm:hidden">Plats</span>
            </span>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Nouveau plat</span>
                  <span className="sm:hidden">Nouveau</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    {editingPlat ? 'Modifier le plat' : 'Nouveau plat'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="nom" className="text-xs sm:text-sm">Nom du plat</Label>
                      <Input
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="categorie" className="text-xs sm:text-sm">Catégorie</Label>
                      <Select value={formData.categorie} onValueChange={(value: 'entree' | 'plat' | 'dessert' | 'boisson') =>
                        setFormData({...formData, categorie: value})}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entree">Entrée</SelectItem>
                          <SelectItem value="plat">Plat</SelectItem>
                          <SelectItem value="dessert">Dessert</SelectItem>
                          <SelectItem value="boisson">Boisson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prix" className="text-xs sm:text-sm">Prix (€)</Label>
                    <Input
                      id="prix"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.prix}
                      onChange={(e) => setFormData({...formData, prix: e.target.value})}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="allergenes" className="text-xs sm:text-sm">Allergènes (séparés par des virgules)</Label>
                    <Input
                      id="allergenes"
                      value={formData.allergenes}
                      onChange={(e) => setFormData({...formData, allergenes: e.target.value})}
                      placeholder="Gluten, Lactose, Noix..."
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="disponible"
                      checked={formData.disponible}
                      onCheckedChange={(checked) => setFormData({...formData, disponible: checked})}
                    />
                    <Label htmlFor="disponible" className="text-xs sm:text-sm">Disponible</Label>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="text-sm">
                      Annuler
                    </Button>
                    <Button type="submit" className="text-sm">
                      {editingPlat ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un plat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="entree">Entrées</SelectItem>
                  <SelectItem value="plat">Plats</SelectItem>
                  <SelectItem value="dessert">Desserts</SelectItem>
                  <SelectItem value="boisson">Boissons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liste des plats */}
          {loading ? (
            <div className="text-center py-6 sm:py-8 text-sm">Chargement...</div>
          ) : filteredPlats.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
              Aucun plat trouvé
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredPlats.map((plat) => (
                <div key={plat.id} className="p-3 sm:p-4 border rounded-lg bg-white">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-semibold text-sm sm:text-base">{plat.nom}</h3>
                        <Badge className={getCategorieColor(plat.categorie) + ' text-xs'}>
                          {getCategorieLabel(plat.categorie)}
                        </Badge>
                        <span className="font-bold text-green-600 text-sm sm:text-base">
                          {plat.prix.toFixed(2)} €
                        </span>
                        {!plat.disponible && (
                          <Badge variant="secondary" className="text-xs">Indisponible</Badge>
                        )}
                      </div>
                      {plat.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">{plat.description}</p>
                      )}
                      {plat.allergenes && plat.allergenes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {plat.allergenes.map((allergene) => (
                            <Badge key={allergene} variant="outline" className="text-xs">
                              {allergene}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 sm:gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(plat)}
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3" />
                        <span className="hidden sm:inline ml-1">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(plat.id)}
                        className="text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="hidden sm:inline ml-1">Suppr.</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
