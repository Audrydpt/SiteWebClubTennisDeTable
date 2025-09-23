/* eslint-disable */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { createPlat, deletePlat, fetchInformations, fetchPlats, updatePlat } from '@/services/api';
import { Plat } from '@/services/type';
import { Check, ClipboardCopy, Edit, Info, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function PlatsManager() {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlat, setEditingPlat] = useState<Plat | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFacebookDialog, setShowFacebookDialog] = useState(false);
  const [facebookMessage, setFacebookMessage] = useState('');
  const [groupId, setGroupId] = useState('1414350289649865');
  const [messageTemplate, setMessageTemplate] = useState('Bonjour @tout le monde\n\n🍽️ Menu du moment au club !\n\n{listePlats}\n\nVenez vous régaler au club, ambiance conviviale garantie !\n\n🔗 https://cttframeries.com\n\n#CTTFrameries #Convivialité #Restauration');
  const [isMessageCopied, setIsMessageCopied] = useState(false);
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
    loadFacebookConfig();
  }, []);

  const loadFacebookConfig = async () => {
    try {
      const infosData = await fetchInformations();
      if (infosData && infosData.length > 0) {
        if (infosData[0].facebookGroupePriveUrl) {
          const url = infosData[0].facebookGroupePriveUrl;
          const match = url.match(/groups\/(\d+)/);
          if (match && match[1]) {
            setGroupId(match[1]);
          }
        }

        if (infosData[0].facebookMessageMenu) {
          setMessageTemplate(infosData[0].facebookMessageMenu);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration Facebook:', error);
    }
  };

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

  const generateFacebookMessage = () => {
    const disponibles = plats.filter(p => p.disponible);
    const lines = disponibles.slice(0, 12).map(p => `• ${p.nom}${p.prix ? ` - ${p.prix.toFixed(2)} €` : ''}`);
    const listePlats = lines.join('\n');
    return messageTemplate.replace(/{listePlats}/g, listePlats || 'À découvrir au club !');
  };

  const handleFacebookShare = () => {
    setFacebookMessage(generateFacebookMessage());
    setIsMessageCopied(false);
    setShowFacebookDialog(true);
  };

  const handleCopyAndOpenFacebook = () => {
    navigator.clipboard.writeText(facebookMessage)
      .then(() => {
        setIsMessageCopied(true);
        window.open(`https://www.facebook.com/groups/${groupId}`, '_blank');
        setTimeout(() => {
          setShowFacebookDialog(false);
          setTimeout(() => setIsMessageCopied(false), 500);
        }, 1000);
      })
      .catch(err => console.error('Erreur lors de la copie du message:', err));
  };

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
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleFacebookShare}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" className="mr-2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Publier Menu sur Facebook
              </Button>
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
            </div>
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
      {/* Dialogue de partage Facebook */}
      <Dialog open={showFacebookDialog} onOpenChange={setShowFacebookDialog}>
        <DialogContent className="w-full max-w-full sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Publier le menu sur le groupe Facebook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fb-message">Message à publier</Label>
              <Textarea
                id="fb-message"
                value={facebookMessage}
                onChange={(e) => setFacebookMessage(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="rounded-md bg-blue-50 p-3">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-blue-700 text-sm">
                  <p className="font-medium mb-1">Comment publier facilement :</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Cliquez sur le bouton "Copier et ouvrir Facebook"</li>
                    <li>Le message sera automatiquement copié</li>
                    <li>Collez le message (Ctrl+V) dans la fenêtre de publication Facebook qui s'ouvre</li>
                  </ol>
                  <p className="mt-2 text-xs">Groupe configuré: ID {groupId}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <DialogClose asChild>
              <Button variant="secondary">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCopyAndOpenFacebook} className="bg-[#1877F2] hover:bg-[#166FE5] text-white">
              {isMessageCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4 mr-2" />
                  Copier et ouvrir Facebook
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
