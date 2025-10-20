/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Edit, Trash2, ChevronDown, ChevronRight, Power, PowerOff, UserPlus } from 'lucide-react';
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
  fetchPlats,
  fetchUsers
} from '@/services/api';
import { Member } from '@/services/type';

export default function ZonesCommandeManager() {
  const [zones, setZones] = useState<ZoneCommande[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCommandeForm, setShowCommandeForm] = useState(false);
  const [selectedZoneForCommande, setSelectedZoneForCommande] = useState<ZoneCommande | null>(null);
  const [editingZone, setEditingZone] = useState<ZoneCommande | null>(null);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    nom: '',
    date: '',
    dateLimiteCommande: '',
    statut: 'ouvert' as 'ouvert' | 'ferme' | 'termine',
    platsDisponibles: [] as string[],
  });
  const [commandeFormData, setCommandeFormData] = useState({
    memberId: '',
    memberName: '',
    items: [] as { platId: string; platNom: string; quantite: number; prix: number }[],
    statut: 'en_attente' as 'en_attente' | 'confirmee' | 'payee',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesData, platsData, membersData] = await Promise.all([
        fetchZonesCommande(),
        fetchPlats(),
        fetchUsers()
      ]);
      setZones(zonesData);
      setPlats(platsData);
      setMembers(membersData);
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

  const getCommandeStatutColor = (statut: string) => {
    switch (statut) {
      case 'confirmee': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'payee': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommandeStatutLabel = (statut: string) => {
    switch (statut) {
      case 'confirmee': return 'Confirmée';
      case 'en_attente': return 'En attente';
      case 'payee': return 'Payée';
      default: return statut;
    }
  };

  const getPlatsByIds = (platIds: string[]) => {
    return plats.filter(plat => platIds.some(id => String(id) === String(plat.id)));
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

  const handleOpenCommandeForm = (zone: ZoneCommande) => {
    setSelectedZoneForCommande(zone);
    setCommandeFormData({
      memberId: '',
      memberName: '',
      items: [],
      statut: 'en_attente',
    });
    setShowCommandeForm(true);
  };

  const handleMemberSelectForCommande = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setCommandeFormData({
        ...commandeFormData,
        memberId: member.id,
        memberName: `${member.prenom} ${member.nom}`,
      });
    }
  };

  const handleAddItemToCommande = (platId: string) => {
    const plat = plats.find(p => String(p.id) === String(platId));
    if (!plat) return;

    const existingItemIndex = commandeFormData.items.findIndex(
      item => String(item.platId) === String(platId)
    );

    if (existingItemIndex >= 0) {
      // Incrémenter la quantité
      const newItems = [...commandeFormData.items];
      newItems[existingItemIndex].quantite += 1;
      setCommandeFormData({ ...commandeFormData, items: newItems });
    } else {
      // Ajouter un nouvel item
      setCommandeFormData({
        ...commandeFormData,
        items: [
          ...commandeFormData.items,
          {
            platId: String(plat.id),
            platNom: plat.nom,
            quantite: 1,
            prix: plat.prix,
          },
        ],
      });
    }
  };

  const handleUpdateItemQuantity = (platId: string, quantite: number) => {
    if (quantite <= 0) {
      // Supprimer l'item
      setCommandeFormData({
        ...commandeFormData,
        items: commandeFormData.items.filter(item => item.platId !== platId),
      });
    } else {
      // Mettre à jour la quantité
      const newItems = commandeFormData.items.map(item =>
        item.platId === platId ? { ...item, quantite } : item
      );
      setCommandeFormData({ ...commandeFormData, items: newItems });
    }
  };

  const calculateTotal = () => {
    return commandeFormData.items.reduce(
      (total, item) => total + item.prix * item.quantite,
      0
    );
  };

  const handleSubmitCommande = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedZoneForCommande || !commandeFormData.memberId || commandeFormData.items.length === 0) {
      alert('Veuillez sélectionner un membre et ajouter au moins un plat');
      return;
    }

    try {
      const nouvelleCommande = {
        memberId: commandeFormData.memberId,
        memberName: commandeFormData.memberName,
        items: commandeFormData.items,
        total: calculateTotal(),
        statut: commandeFormData.statut,
        dateCommande: new Date().toISOString(),
      };

      const updatedZone = {
        ...selectedZoneForCommande,
        commandes: [...selectedZoneForCommande.commandes, nouvelleCommande],
      };

      await updateZoneCommande(selectedZoneForCommande.id, updatedZone);
      await loadData();
      setShowCommandeForm(false);
      setSelectedZoneForCommande(null);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      alert('Erreur lors de la création de la commande');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête avec statistiques responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total zones</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Power className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Ouvertes</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.ouvertes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <PowerOff className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Fermées</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.fermees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Commandes</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalCommandes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zones de commande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-lg sm:text-xl">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Zones de commande</span>
              <span className="sm:hidden">Zones</span>
            </span>
            <div className="flex gap-2">
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Nouvelle zone</span>
                    <span className="sm:hidden">Nouvelle</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                      {editingZone ? 'Modifier la zone' : 'Nouvelle zone de commande'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="nom" className="text-xs sm:text-sm">Nom de la zone</Label>
                      <Input
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        placeholder="Ex: Menu du samedi 15 décembre"
                        required
                        className="text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="date" className="text-xs sm:text-sm">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateLimiteCommande" className="text-xs sm:text-sm">Date limite</Label>
                        <Input
                          id="dateLimiteCommande"
                          type="datetime-local"
                          value={formData.dateLimiteCommande}
                          onChange={(e) => setFormData({...formData, dateLimiteCommande: e.target.value})}
                          required
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="statut" className="text-xs sm:text-sm">Statut</Label>
                      <Select value={formData.statut} onValueChange={(value: 'ouvert' | 'ferme' | 'termine') =>
                        setFormData({...formData, statut: value})}>
                        <SelectTrigger className="text-sm">
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
                      <Label className="text-xs sm:text-sm">Plats disponibles</Label>
                      <div className="border rounded-lg p-3 sm:p-4 max-h-48 sm:max-h-60 overflow-y-auto space-y-3">
                        {['entree', 'plat', 'dessert', 'boisson'].map(categorie => {
                          const platsCategorie = plats.filter(p => p.categorie === categorie && p.disponible);
                          if (platsCategorie.length === 0) return null;

                          return (
                            <div key={categorie}>
                              <h4 className="font-semibold mb-2 capitalize text-sm">{categorie}s</h4>
                              <div className="space-y-2">
                                {platsCategorie.map(plat => (
                                  <div key={plat.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={String(plat.id)}
                                      checked={formData.platsDisponibles.some(id => String(id) === String(plat.id))}
                                      onCheckedChange={(checked) => handlePlatToggle(String(plat.id), checked as boolean)}
                                    />
                                    <Label htmlFor={String(plat.id)} className="flex-1 cursor-pointer text-sm">
                                      <span className="font-medium">{plat.nom}</span>
                                      <span className="text-xs sm:text-sm text-gray-500 ml-2">({plat.prix.toFixed(2)} €)</span>
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="text-sm">
                        Annuler
                      </Button>
                      <Button type="submit" className="text-sm">
                        {editingZone ? 'Modifier' : 'Créer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showCommandeForm} onOpenChange={setShowCommandeForm}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => handleOpenCommandeForm(zones[0])}
                    className="text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Nouvelle commande</span>
                    <span className="sm:hidden">Commande</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                      Nouvelle commande pour {selectedZoneForCommande ? selectedZoneForCommande.nom : ''}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitCommande} className="space-y-3 sm:space-y-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Membre</Label>
                      <Select
                        value={commandeFormData.memberId}
                        onValueChange={handleMemberSelectForCommande}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Sélectionner un membre" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.prenom} {member.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedZoneForCommande && (
                      <div>
                        <Label className="text-xs sm:text-sm">Plats disponibles</Label>
                        <div className="border rounded-lg p-3 sm:p-4 max-h-60 overflow-y-auto space-y-2">
                          {getPlatsByIds(selectedZoneForCommande.platsDisponibles).length === 0 ? (
                            <p className="text-sm text-gray-500 italic">Aucun plat disponible pour cette zone</p>
                          ) : (
                            getPlatsByIds(selectedZoneForCommande.platsDisponibles).map(plat => {
                              const item = commandeFormData.items.find(i => String(i.platId) === String(plat.id));
                              const quantite = item ? item.quantite : 0;

                              return (
                                <div key={plat.id} className="flex items-center justify-between gap-2 p-2 border rounded bg-gray-50">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{plat.nom}</p>
                                    <p className="text-xs text-gray-600">{plat.prix.toFixed(2)} €</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateItemQuantity(String(plat.id), quantite - 1)}
                                      disabled={quantite === 0}
                                      className="h-8 w-8 p-0"
                                    >
                                      -
                                    </Button>
                                    <span className="w-8 text-center font-semibold text-sm">{quantite}</span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (quantite === 0) {
                                          handleAddItemToCommande(String(plat.id));
                                        } else {
                                          handleUpdateItemQuantity(String(plat.id), quantite + 1);
                                        }
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {commandeFormData.items.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <h4 className="font-semibold text-sm mb-2">Récapitulatif</h4>
                        <div className="space-y-1 text-sm">
                          {commandeFormData.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.platNom} x{item.quantite}</span>
                              <span className="font-semibold">{(item.prix * item.quantite).toFixed(2)} €</span>
                            </div>
                          ))}
                          <div className="flex justify-between pt-2 border-t border-blue-300 font-bold">
                            <span>Total</span>
                            <span>{calculateTotal().toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs sm:text-sm">Statut de la commande</Label>
                      <Select
                        value={commandeFormData.statut}
                        onValueChange={(value: 'en_attente' | 'confirmee' | 'payee') =>
                          setCommandeFormData({...commandeFormData, statut: value})}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en_attente">En attente</SelectItem>
                          <SelectItem value="confirmee">Confirmée</SelectItem>
                          <SelectItem value="payee">Payée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCommandeForm(false);
                          setSelectedZoneForCommande(null);
                        }}
                        className="text-sm"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        className="text-sm bg-green-600 hover:bg-green-500"
                        disabled={!commandeFormData.memberId || commandeFormData.items.length === 0}
                      >
                        Créer la commande
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 sm:py-8 text-sm">Chargement...</div>
          ) : zones.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
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
                      {/* En-tête de la zone responsive */}
                      <div className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleExpanded(zone.id)}
                              className="p-0 h-auto shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                              ) : (
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm sm:text-base truncate">{zone.nom}</h3>
                                <Badge className={getStatutColor(zone.statut) + ' text-xs'}>
                                  {zone.statut}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <span>{formatDate(zone.date)}</span>
                                <span className="hidden sm:inline">Limite: {formatLimitDate(zone.dateLimiteCommande)}</span>
                                <span className="sm:hidden">Limite: {formatLimitDate(zone.dateLimiteCommande)}</span>
                                <span>{zone.commandes.length} cmd(s)</span>
                                <span>{zone.platsDisponibles.length} plat(s)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Bouton pour ajouter une commande à cette zone */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCommandeForm(zone)}
                              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                            >
                              <UserPlus className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Commande</span>
                            </Button>

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
                                    <span className="hidden sm:inline">Fermer</span>
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Ouvrir</span>
                                  </>
                                )}
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(zone)}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(zone.id)}
                              className="text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Suppr.</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Détails de la zone (dépliable) responsive */}
                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-3 sm:p-4 space-y-3 sm:space-y-4">
                          {/* Plats disponibles par catégorie */}
                          <div>
                            <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Plats disponibles</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                              {Object.entries(platsParCategorie).map(([categorie, platsCategorie]) => {
                                if (platsCategorie.length === 0) return null;
                                return (
                                  <div key={categorie} className="bg-white p-2 sm:p-3 rounded border">
                                    <h5 className="font-medium mb-2 capitalize text-xs sm:text-sm">{categorie}s ({platsCategorie.length})</h5>
                                    <div className="space-y-1">
                                      {platsCategorie.map(plat => (
                                        <div key={plat.id} className="flex items-center justify-between text-xs sm:text-sm">
                                          <span className="truncate">{plat.nom}</span>
                                          <span className="font-semibold shrink-0 ml-2">{plat.prix.toFixed(2)} €</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Commandes responsive */}
                          <div>
                            <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Commandes ({zone.commandes.length})</h4>
                            {zone.commandes.length === 0 ? (
                              <p className="text-xs sm:text-sm text-gray-500 italic bg-white p-2 sm:p-3 rounded border">Aucune commande</p>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                                {zone.commandes.map((commande, index) => (
                                  <div key={index} className="bg-white p-2 sm:p-3 border rounded">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                      <span className="font-medium text-xs sm:text-sm truncate">{commande.memberName}</span>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          className={getCommandeStatutColor(commande.statut) + ' text-xs'}
                                          variant="outline"
                                        >
                                          {getCommandeStatutLabel(commande.statut)}
                                        </Badge>
                                        <span className="font-semibold text-xs sm:text-sm">{commande.total.toFixed(2)} €</span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {commande.items.map((item, itemIndex) => (
                                        <span key={itemIndex} className="break-words">
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

      {/* Dialogue de création de commande */}
      <Dialog open={showCommandeForm} onOpenChange={setShowCommandeForm}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Nouvelle commande {selectedZoneForCommande ? `pour ${selectedZoneForCommande.nom}` : ''}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCommande} className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Membre</Label>
              <Select
                value={commandeFormData.memberId}
                onValueChange={handleMemberSelectForCommande}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.prenom} {member.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedZoneForCommande && (
              <div>
                <Label className="text-xs sm:text-sm">Plats disponibles</Label>
                <div className="border rounded-lg p-3 sm:p-4 max-h-60 overflow-y-auto space-y-2">
                  {getPlatsByIds(selectedZoneForCommande.platsDisponibles).length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Aucun plat disponible pour cette zone</p>
                  ) : (
                    getPlatsByIds(selectedZoneForCommande.platsDisponibles).map(plat => {
                      const item = commandeFormData.items.find(i => String(i.platId) === String(plat.id));
                      const quantite = item ? item.quantite : 0;

                      return (
                        <div key={plat.id} className="flex items-center justify-between gap-2 p-2 border rounded bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{plat.nom}</p>
                            <p className="text-xs text-gray-600">{plat.prix.toFixed(2)} €</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateItemQuantity(String(plat.id), quantite - 1)}
                              disabled={quantite === 0}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-semibold text-sm">{quantite}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (quantite === 0) {
                                  handleAddItemToCommande(String(plat.id));
                                } else {
                                  handleUpdateItemQuantity(String(plat.id), quantite + 1);
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {commandeFormData.items.length > 0 && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="font-semibold text-sm mb-2">Récapitulatif</h4>
                <div className="space-y-1 text-sm">
                  {commandeFormData.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.platNom} x{item.quantite}</span>
                      <span className="font-semibold">{(item.prix * item.quantite).toFixed(2)} €</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-blue-300 font-bold">
                    <span>Total</span>
                    <span>{calculateTotal().toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs sm:text-sm">Statut de la commande</Label>
              <Select
                value={commandeFormData.statut}
                onValueChange={(value: 'en_attente' | 'confirmee' | 'payee') =>
                  setCommandeFormData({...commandeFormData, statut: value})}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="confirmee">Confirmée</SelectItem>
                  <SelectItem value="payee">Payée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCommandeForm(false);
                  setSelectedZoneForCommande(null);
                }}
                className="text-sm"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="text-sm bg-green-600 hover:bg-green-500"
                disabled={!commandeFormData.memberId || commandeFormData.items.length === 0}
              >
                Créer la commande
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
