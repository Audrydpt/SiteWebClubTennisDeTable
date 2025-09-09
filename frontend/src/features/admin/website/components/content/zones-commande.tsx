/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Edit, Trash2, ChevronDown, ChevronRight, Power, PowerOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ZoneCommande, Plat } from '@/services/type';
import {
  fetchZonesCommande,
  createZoneCommande,
  updateZoneCommande,
  deleteZoneCommande,
  fetchPlats
} from '@/services/api';

export default function ZonesCommandeManager() {
  const [zones, setZones] = useState<ZoneCommande[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneCommande | null>(null);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    nom: '',
    date: '',
    dateLimiteCommande: '',
    statut: 'ouvert' as 'ouvert' | 'ferme' | 'termine',
    platsDisponibles: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesData, platsData] = await Promise.all([
        fetchZonesCommande(),
        fetchPlats()
      ]);
      setZones(zonesData);
      setPlats(platsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      date: '',
      dateLimiteCommande: '',
      statut: 'ouvert',
      platsDisponibles: [],
    });
    setEditingZone(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const zoneData = {
        ...formData,
        commandes: editingZone ? editingZone.commandes : [],
      };

      if (editingZone) {
        await updateZoneCommande(editingZone.id, { ...editingZone, ...zoneData });
      } else {
        await createZoneCommande(zoneData);
      }

      await loadData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (zone: ZoneCommande) => {
    setEditingZone(zone);
    setFormData({
      nom: zone.nom,
      date: zone.date,
      dateLimiteCommande: zone.dateLimiteCommande,
      statut: zone.statut,
      platsDisponibles: zone.platsDisponibles,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette zone de commande ?')) {
      try {
        await deleteZoneCommande(id);
        await loadData();
        setExpandedZones(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const toggleZoneStatus = async (zone: ZoneCommande) => {
    const newStatut = zone.statut === 'ouvert' ? 'ferme' : 'ouvert';

    try {
      await updateZoneCommande(zone.id, { ...zone, statut: newStatut });
      await loadData();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const toggleExpanded = (zoneId: string) => {
    setExpandedZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneId)) {
        newSet.delete(zoneId);
      } else {
        newSet.add(zoneId);
      }
      return newSet;
    });
  };

  const handlePlatToggle = (platId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        platsDisponibles: [...formData.platsDisponibles, platId]
      });
    } else {
      setFormData({
        ...formData,
        platsDisponibles: formData.platsDisponibles.filter(id => id !== platId)
      });
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  const formatLimitDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'ouvert': return 'bg-green-100 text-green-800';
      case 'ferme': return 'bg-orange-100 text-orange-800';
      case 'termine': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatsByIds = (platIds: string[]) => {
    return plats.filter(plat => platIds.includes(plat.id));
  };

  const getPlatsByCategorie = (platIds: string[]) => {
    const selectedPlats = getPlatsByIds(platIds);
    return {
      entrees: selectedPlats.filter(p => p.categorie === 'entree'),
      plats: selectedPlats.filter(p => p.categorie === 'plat'),
      desserts: selectedPlats.filter(p => p.categorie === 'dessert'),
      boissons: selectedPlats.filter(p => p.categorie === 'boisson'),
    };
  };

  const stats = {
    total: zones.length,
    ouvertes: zones.filter(z => z.statut === 'ouvert').length,
    fermees: zones.filter(z => z.statut === 'ferme').length,
    totalCommandes: zones.reduce((acc, zone) => acc + zone.commandes.length, 0),
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total zones</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Power className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Ouvertes</p>
                <p className="text-2xl font-bold">{stats.ouvertes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PowerOff className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Fermées</p>
                <p className="text-2xl font-bold">{stats.fermees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Commandes</p>
                <p className="text-2xl font-bold">{stats.totalCommandes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zones de commande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Zones de commande
            </span>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle zone
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingZone ? 'Modifier la zone' : 'Nouvelle zone de commande'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom de la zone</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      placeholder="Ex: Menu du samedi 15 décembre"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateLimiteCommande">Date limite</Label>
                      <Input
                        id="dateLimiteCommande"
                        type="datetime-local"
                        value={formData.dateLimiteCommande}
                        onChange={(e) => setFormData({...formData, dateLimiteCommande: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="statut">Statut</Label>
                    <Select value={formData.statut} onValueChange={(value: 'ouvert' | 'ferme' | 'termine') =>
                      setFormData({...formData, statut: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ouvert">Ouvert</SelectItem>
                        <SelectItem value="ferme">Fermé</SelectItem>
                        <SelectItem value="termine">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Plats disponibles</Label>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
                      {['entree', 'plat', 'dessert', 'boisson'].map(categorie => {
                        const platsCategorie = plats.filter(p => p.categorie === categorie && p.disponible);
                        if (platsCategorie.length === 0) return null;

                        return (
                          <div key={categorie}>
                            <h4 className="font-semibold mb-2 capitalize">{categorie}s</h4>
                            <div className="space-y-2">
                              {platsCategorie.map(plat => (
                                <div key={plat.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={plat.id}
                                    checked={formData.platsDisponibles.includes(plat.id)}
                                    onCheckedChange={(checked) => handlePlatToggle(plat.id, checked as boolean)}
                                  />
                                  <Label htmlFor={plat.id} className="flex-1 cursor-pointer">
                                    <span className="font-medium">{plat.nom}</span>
                                    <span className="text-sm text-gray-500 ml-2">({plat.prix.toFixed(2)} €)</span>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingZone ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : zones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune zone de commande
            </div>
          ) : (
            <div className="space-y-3">
              {zones
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((zone) => {
                  const isExpanded = expandedZones.has(zone.id);
                  const platsParCategorie = getPlatsByCategorie(zone.platsDisponibles);

                  return (
                    <div key={zone.id} className="border rounded-lg bg-white">
                      {/* En-tête de la zone */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleExpanded(zone.id)}
                              className="p-0 h-auto"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{zone.nom}</h3>
                                <Badge className={getStatutColor(zone.statut)}>
                                  {zone.statut}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{formatDate(zone.date)}</span>
                                <span>Limite: {formatLimitDate(zone.dateLimiteCommande)}</span>
                                <span>{zone.commandes.length} commande(s)</span>
                                <span>{zone.platsDisponibles.length} plat(s)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Bouton pour fermer/ouvrir la zone */}
                            {zone.statut !== 'termine' && (
                              <Button
                                size="sm"
                                variant={zone.statut === 'ouvert' ? 'destructive' : 'default'}
                                onClick={() => toggleZoneStatus(zone)}
                                className="text-xs"
                              >
                                {zone.statut === 'ouvert' ? (
                                  <>
                                    <PowerOff className="h-3 w-3 mr-1" />
                                    Fermer
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-3 w-3 mr-1" />
                                    Ouvrir
                                  </>
                                )}
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(zone)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(zone.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Détails de la zone (dépliable) */}
                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-4 space-y-4">
                          {/* Plats disponibles par catégorie */}
                          <div>
                            <h4 className="font-semibold mb-3">Plats disponibles</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(platsParCategorie).map(([categorie, platsCategorie]) => {
                                if (platsCategorie.length === 0) return null;
                                return (
                                  <div key={categorie} className="bg-white p-3 rounded border">
                                    <h5 className="font-medium mb-2 capitalize">{categorie}s ({platsCategorie.length})</h5>
                                    <div className="space-y-1">
                                      {platsCategorie.map(plat => (
                                        <div key={plat.id} className="flex items-center justify-between text-sm">
                                          <span>{plat.nom}</span>
                                          <span className="font-semibold">{plat.prix.toFixed(2)} €</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Commandes */}
                          <div>
                            <h4 className="font-semibold mb-3">Commandes ({zone.commandes.length})</h4>
                            {zone.commandes.length === 0 ? (
                              <p className="text-sm text-gray-500 italic bg-white p-3 rounded border">Aucune commande</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {zone.commandes.map((commande, index) => (
                                  <div key={index} className="bg-white p-3 border rounded">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">{commande.memberName}</span>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">{commande.statut}</Badge>
                                        <span className="font-semibold text-sm">{commande.total.toFixed(2)} €</span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {commande.items.map((item, itemIndex) => (
                                        <span key={itemIndex}>
                                          {item.platNom} x{item.quantite}
                                          {itemIndex < commande.items.length - 1 && ', '}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
