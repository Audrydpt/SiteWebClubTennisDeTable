/* eslint-disable */
import { useState, useEffect } from 'react';
import {
  Save,
  Edit,
  Search,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchSaisons, updateSaison } from '@/services/api';
import type { Saison } from '@/services/type.ts';

export default function UpdateClubsInfos() {
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClub, setEditingClub] = useState<{
    nom: string;
    infos: any;
    saisonId: string;
    clubId?: string;
  } | null>(null);

  useEffect(() => {
    const loadSaisons = async () => {
      try {
        const data = await fetchSaisons();
        setSaisons(data);
      } catch (error) {
        console.error('Erreur lors du chargement des saisons:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSaisons();
  }, []);

  // Fonction utilitaire pour extraire le nom du club
  const extraireNomClub = (nomEquipe: string): string => {
    return nomEquipe
      .replace(/\s+[A-Z]$/, '')
      .replace(/\s+\d+$/, '')
      .replace(/\s+(Dame|Dames)$/, '')
      .replace(/\s+(Vét\.|Veteran)$/, '')
      .trim();
  };

  // Obtenir tous les clubs adverses avec leurs infos
  const getAllAdversaryClubs = () => {
    const clubsMap = new Map<string, {
      nom: string;
      equipes: string[];
      saisons: Array<{ saisonId: string; saisonLabel: string; infos?: any }>;
    }>();

    saisons.forEach(saison => {
      const clubsDejaVus = new Set<string>();

      saison.series.forEach(serie => {
        serie.equipes
          .filter(equipe => !saison.equipesClub.some(clubTeam => clubTeam.nom === equipe.nom))
          .forEach(equipe => {
            const nomClub = extraireNomClub(equipe.nom);

            if (!clubsDejaVus.has(nomClub)) {
              clubsDejaVus.add(nomClub);

              if (!clubsMap.has(nomClub)) {
                clubsMap.set(nomClub, {
                  nom: nomClub,
                  equipes: [],
                  saisons: []
                });
              }

              const club = clubsMap.get(nomClub)!;

              // Ajouter l'équipe si elle n'existe pas déjà
              if (!club.equipes.includes(equipe.nom)) {
                club.equipes.push(equipe.nom);
              }

              // Trouver les infos du club dans cette saison
              const infosClub = saison.clubs?.find(c => c.nom === nomClub);

              // Ajouter la saison si elle n'existe pas déjà
              const saisonExistante = club.saisons.find(s => s.saisonId === saison.id);
              if (!saisonExistante) {
                club.saisons.push({
                  saisonId: saison.id,
                  saisonLabel: saison.label,
                  infos: infosClub
                });
              }
            }
          });
      });
    });

    return Array.from(clubsMap.values());
  };

  const filteredClubs = getAllAdversaryClubs().filter(club =>
    club.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clubsWithInfos = filteredClubs.filter(club =>
    club.saisons.some(s => s.infos)
  );
  const clubsWithoutInfos = filteredClubs.filter(club =>
    !club.saisons.some(s => s.infos)
  );

  const handleSaveInfos = async () => {
    if (!editingClub) return;

    try {
      const saison = saisons.find(s => s.id === editingClub.saisonId);
      if (!saison) return;

      // Initialiser le tableau clubs s'il n'existe pas
      const clubsExistants = saison.clubs || [];

      // Vérifier si le club existe déjà
      const clubExistant = clubsExistants.find(c => c.nom === editingClub.nom);

      let clubsUpdated;
      if (clubExistant) {
        // Mettre à jour le club existant
        clubsUpdated = clubsExistants.map(club =>
          club.nom === editingClub.nom
            ? {
                ...club,
                localite: editingClub.infos?.localite || '',
                salle: editingClub.infos?.salle || '',
                adresse: editingClub.infos?.adresse || '',
                telephone: editingClub.infos?.telephone || '',
                email: editingClub.infos?.email || '',
                site: editingClub.infos?.site || '',
              }
            : club
        );
      } else {
        // Ajouter un nouveau club
        clubsUpdated = [...clubsExistants, {
          id: editingClub.clubId || `club-${Date.now()}`,
          nom: editingClub.nom,
          localite: editingClub.infos?.localite || '',
          salle: editingClub.infos?.salle || '',
          adresse: editingClub.infos?.adresse || '',
          telephone: editingClub.infos?.telephone || '',
          email: editingClub.infos?.email || '',
          site: editingClub.infos?.site || '',
        }];
      }

      const updatedSaison = {
        ...saison,
        clubs: clubsUpdated
      };

      await updateSaison(saison.id, updatedSaison);

      // Mettre à jour l'état local
      setSaisons(saisons.map(s => s.id === saison.id ? updatedSaison : s));
      setEditingClub(null);

      alert('Informations sauvegardées avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-lg font-medium">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Informations des Clubs Adverses
        </h1>
        <p className="text-gray-600">
          Gérez les informations de contact et localisation des clubs adverses
        </p>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'édition */}
      {editingClub && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifier les informations - {editingClub.nom}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-localite">Localité</Label>
                <Input
                  id="edit-localite"
                  value={editingClub.infos?.localite || ''}
                  onChange={(e) =>
                    setEditingClub({
                      ...editingClub,
                      infos: { ...editingClub.infos, localite: e.target.value },
                    })
                  }
                  placeholder="Ex: Mons"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salle">Nom de la salle</Label>
                <Input
                  id="edit-salle"
                  value={editingClub.infos?.salle || ''}
                  onChange={(e) =>
                    setEditingClub({
                      ...editingClub,
                      infos: { ...editingClub.infos, salle: e.target.value },
                    })
                  }
                  placeholder="Ex: Salle communale"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-adresse">Adresse complète</Label>
                <Input
                  id="edit-adresse"
                  value={editingClub.infos?.adresse || ''}
                  onChange={(e) =>
                    setEditingClub({
                      ...editingClub,
                      infos: { ...editingClub.infos, adresse: e.target.value },
                    })
                  }
                  placeholder="Ex: Rue de la Paix 123, 7000 Mons"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telephone">Téléphone</Label>
                <Input
                  id="edit-telephone"
                  value={editingClub.infos?.telephone || ''}
                  onChange={(e) =>
                    setEditingClub({
                      ...editingClub,
                      infos: {
                        ...editingClub.infos,
                        telephone: e.target.value,
                      },
                    })
                  }
                  placeholder="Ex: +32 65 12 34 56"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingClub.infos?.email || ''}
                  onChange={(e) =>
                    setEditingClub({
                      ...editingClub,
                      infos: { ...editingClub.infos, email: e.target.value },
                    })
                  }
                  placeholder="Ex: contact@club.be"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-site">Site web</Label>
                <Input
                  id="edit-site"
                  type="url"
                  value={editingClub.infos?.site || ''}
                  onChange={(e) =>
                    setEditingClub({
                      ...editingClub,
                      infos: { ...editingClub.infos, site: e.target.value },
                    })
                  }
                  placeholder="Ex: https://www.club.be"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingClub(null)}>
                Annuler
              </Button>
              <Button onClick={handleSaveInfos}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des clubs */}
      <Tabs defaultValue="with-infos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="with-infos">
            Avec informations ({clubsWithInfos.length})
          </TabsTrigger>
          <TabsTrigger value="without-infos">
            Sans informations ({clubsWithoutInfos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="with-infos" className="space-y-4">
          {clubsWithInfos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun club avec informations
                </h3>
                <p className="text-gray-500">
                  Les clubs avec des informations complètes apparaîtront ici
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {clubsWithInfos.map((club, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{club.nom}</h3>
                          <div className="text-sm text-muted-foreground mb-3">
                            {club.equipes.length} équipe{club.equipes.length > 1 ? 's' : ''}: {club.equipes.join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Informations par saison */}
                      <div className="space-y-3">
                        {club.saisons
                          .filter(s => s.infos)
                          .map((saison, sIndex) => (
                            <div key={sIndex} className="p-3 bg-muted rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{saison.saisonLabel}</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingClub({
                                    nom: club.nom,
                                    infos: saison.infos || {},
                                    saisonId: saison.saisonId,
                                    clubId: saison.infos?.id
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {saison.infos?.localite && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{saison.infos.localite}</span>
                                  </div>
                                )}
                                {saison.infos?.salle && (
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span>{saison.infos.salle}</span>
                                  </div>
                                )}
                                {saison.infos?.telephone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{saison.infos.telephone}</span>
                                  </div>
                                )}
                                {saison.infos?.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{saison.infos.email}</span>
                                  </div>
                                )}
                                {saison.infos?.site && (
                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{saison.infos.site}</span>
                                  </div>
                                )}
                                {saison.infos?.adresse && (
                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{saison.infos.adresse}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="without-infos" className="space-y-4">
          {clubsWithoutInfos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tous les clubs ont des informations !
                </h3>
                <p className="text-gray-500">
                  Parfait ! Tous vos clubs adverses ont des informations complètes
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {clubsWithoutInfos.map((club, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{club.nom}</h4>
                          <p className="text-sm text-muted-foreground">
                            {club.equipes.length} équipe{club.equipes.length > 1 ? 's' : ''}: {club.equipes.join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Boutons pour ajouter des infos par saison */}
                      <div className="flex flex-wrap gap-2">
                        {club.saisons.map((saison, sIndex) => (
                          <Button
                            key={sIndex}
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingClub({
                              nom: club.nom,
                              infos: {},
                              saisonId: saison.saisonId,
                            })}
                          >
                            Ajouter infos pour {saison.saisonLabel}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
