/* eslint-disable */
import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Users,
  Trophy,
  MapPin,
  Loader2,
  Ban,
  Info,
  Building,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  Award,
  Target,
  User,
  CalendarX,
  Dumbbell,
  UtensilsCrossed,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { fetchSaisonEnCours } from '@/services/api.ts';
import {
  Member,
  Match,
  ClubInfo,
  InfosPersonnalisees,
} from '@/services/type.ts';
import supabase from '@/lib/supabaseClient.ts';

export default function HomeLogged() {
  const [member, setMember] = useState<Member | null>(null);
  const [mesMatchs, setMesMatchs] = useState<Match[]>([]);
  const [equipiers, setEquipiers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showClubInfoModal, setShowClubInfoModal] = useState(false);
  const [selectedClubInfo, setSelectedClubInfo] = useState<{
    clubInfo?: ClubInfo;
    infosPersonnalisees?: InfosPersonnalisees;
    clubName: string;
  } | null>(null);
  const [infosPersonnalisees, setInfosPersonnalisees] = useState<InfosPersonnalisees[]>([]);

  const getInitials = (nom: string, prenom: string) => {
    // Si le prénom est vide ou si le nom contient déjà prénom + nom
    if (!prenom || nom.includes(' ')) {
      // Diviser le nom complet et prendre les premières lettres
      const parts = nom.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      }
      return nom.substring(0, 2).toUpperCase();
    }

    // Cas normal : prénom et nom séparés
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const formatDateFR = (dateString?: string) => {
    if (!dateString || dateString === 'jj-mm-aaaa') return 'Date à venir';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date à venir';

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch {
      return 'Date à venir';
    }
  };

  // Fonction pour formater la date en version courte pour les onglets
  const formatDateCourte = (dateString?: string) => {
    if (!dateString || dateString === 'jj-mm-aaaa') return 'À venir';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'À venir';

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      return `${day}/${month}`;
    } catch {
      return 'À venir';
    }
  };

  // 🔄 Récupération des infos JSON Server du membre connecté
  useEffect(() => {
    const fetchMemberData = async () => {
      setLoading(true);
      setError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        setError('Utilisateur non authentifié.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/membres?supabase_uid=${user.id}`
        );
        const users: Member[] = await res.json(); // Changer de Joueur à Member
        setMember(users[0] || null);
      } catch (err) {
        setError('Erreur de chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!member) return;

      const saison = await fetchSaisonEnCours();
      if (!saison?.calendrier) return;

      const matchs = saison.calendrier.filter((match: Match) => {
        const tousJoueurs = [
          ...(match.joueur_dom || []),
          ...(match.joueur_ext || []),
        ];
        return tousJoueurs.some((j) => j.id === member.id) && !match.score;
      });

      setMesMatchs(matchs);

      // Charger les infos personnalisées
      if (saison.infosPersonnalisees) {
        setInfosPersonnalisees(saison.infosPersonnalisees);
      }

      // MODIFICATION: Récupérer TOUS les équipiers de TOUS les matchs
      if (matchs.length > 0) {
        const tousEquipiers = new Map<string, Member>();

        matchs.forEach((match: { joueur_dom: any; joueur_ext: any }) => {
          const equipiersMatch = [
            ...(match.joueur_dom || []),
            ...(match.joueur_ext || []),
          ].filter((j) => j.id !== member.id);

          // Ajouter chaque équipier unique à la Map
          equipiersMatch.forEach((joueur) => {
            if (!tousEquipiers.has(joueur.id)) {
              const equipierMembre = {
                ...joueur,
                supabase_uid: '', // Valeur par défaut
                telephone: '', // Valeur par défaut
                email: '', // Valeur par défaut
              } as Member;
              tousEquipiers.set(joueur.id, equipierMembre);
            }
          });
        });

        // Convertir la Map en array
        setEquipiers(Array.from(tousEquipiers.values()));
      }
    };

    loadData();
  }, [member]);

  // Fonction pour récupérer l'index d'un joueur depuis les données membres
  const getPlayerIndex = (playerId: string): number => {
    // D'abord chercher dans les membres (données complètes)
    try {
      const response = fetch(
        `${import.meta.env.VITE_API_URL}/membres?id=${playerId}`
      );
      // Pour l'instant, retourner 0 en attendant la réponse async
      return 0;
    } catch {
      return 0;
    }
  };

  // Fonction pour extraire le nom du club à partir du nom d'équipe
  const extraireNomClub = (nomEquipe: string): string =>
    nomEquipe
      .replace(/\s+[A-Z]$/, '')
      .replace(/\s+\d+$/, '')
      .replace(/\s+(Dame|Dames)$/, '')
      .replace(/\s+(Vét\.|Veteran)$/, '')
      .trim();

  // Fonction pour obtenir les infos d'un club adversaire
  const getClubInfo = async (match: Match) => {
    try {
      const saison = await fetchSaisonEnCours();
      if (!saison) return null;

      // Déterminer le nom du club adversaire
      const clubAdversaire = match.domicile.includes('CTT Frameries')
        ? extraireNomClub(match.exterieur)
        : extraireNomClub(match.domicile);

      // Chercher les infos générales du club
      const clubInfo = saison.clubs?.find(
        (club: { nom: string }) => club.nom === clubAdversaire
      );

      // Chercher les infos personnalisées pour ce match
      const infosPersonnalisees = saison.infosPersonnalisees?.find(
        (info: { matchId: string }) => info.matchId === match.id
      );

      return {
        clubInfo,
        infosPersonnalisees,
        clubName: clubAdversaire,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos club:', error);
      return null;
    }
  };

  // Gestionnaire pour afficher les infos du club
  const handleShowClubInfo = async (match: Match) => {
    const infos = await getClubInfo(match);
    if (infos) {
      setSelectedClubInfo(infos);
      setShowClubInfoModal(true);
    }
  };

  // Fonction pour vérifier s'il y a des infos exceptionnelles pour un match
  const hasExceptionalInfo = (match: Match): boolean => {
    return infosPersonnalisees.some(
      (info: { matchId: string }) => info.matchId === match.id
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  if (error) return <div className="text-red-500">{error}</div>;
  if (!member) return <div>Aucun membre trouvé.</div>;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* En-tête joueur simplifié */}
      <div className="bg-gradient-to-r from-[#F1C40F] to-[#D4AC0D] text-white p-6 rounded-lg">
        <div className="relative p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Section principale avec avatar et nom */}
            <div className="flex items-center gap-6">
              {/* Avatar stylisé */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Informations principales */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight mb-3 text-white drop-shadow-sm">
                  {member.prenom} {member.nom}
                </h1>

                {/* Badges d'informations */}
                <div className="flex flex-wrap items-center gap-2">
                  {member.classement && (
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-medium">
                  Classement: {member.classement}
                </span>
                    </div>
                  )}

                  {member.indexListeForce && member.indexListeForce > 0 && (
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                      <Target className="w-4 h-4" />
                      <span className="text-sm font-medium">
                  Index: {member.indexListeForce}
                </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section statistiques simplifiée */}
            {member.indexListeForce && member.indexListeForce > 0 && (
              <div className="flex lg:flex-col gap-4 lg:text-right">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 min-w-[120px]">
                  <div className="text-2xl font-bold text-white">
                    {member.indexListeForce}
                  </div>
                  <div className="text-sm text-white/90">
                    Index
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochains matchs */}
        <Card className="bg-white border border-[#E0E0E0]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Mes prochains matchs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mesMatchs.map((match) => {
                const isHomeMatch = match.domicile.includes('CTT Frameries');
                const equipeFrameries = isHomeMatch
                  ? match.domicile
                  : match.exterieur;
                const adversaire = isHomeMatch
                  ? match.exterieur
                  : match.domicile;

                return (
                  <div
                    key={match.id}
                    className="p-4 border border-[#E0E0E0] rounded-lg bg-[#F9F9F9]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isHomeMatch ? (
                          <>
                            <Badge variant="secondary">Domicile</Badge>
                            <span className="font-semibold">
                              {equipeFrameries}
                            </span>
                            <span>vs</span>
                            <span>{adversaire}</span>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline">Extérieur</Badge>
                            <span>{match.domicile}</span>
                            <span>vs</span>
                            <span className="font-semibold">
                              {equipeFrameries}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDateFR(match.date)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{match.domicile}</span>
                      </div>
                      {(!isHomeMatch || hasExceptionalInfo(match)) && (
                        <Button
                          variant={hasExceptionalInfo(match) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleShowClubInfo(match)}
                          className={`text-xs ${
                            hasExceptionalInfo(match)
                              ? "bg-orange-500 hover:bg-orange-600 text-white animate-pulse border-orange-400 shadow-lg"
                              : ""
                          }`}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          {hasExceptionalInfo(match) ? "⚠️ Infos importantes" : "Infos club"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {mesMatchs.length === 0 && (
                <div className="text-gray-500 text-center p-4">
                  Aucun match prévu.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mon équipe */}
        <Card className="bg-white border border-[#E0E0E0]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Mon équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mesMatchs.length > 1 ? (
              <Tabs defaultValue={mesMatchs[0].id}>
                <TabsList className="grid w-full grid-cols-2 h-8 mb-3">
                  {mesMatchs.map((match) => {
                    const isHomeMatch =
                      match.domicile.includes('CTT Frameries');
                    const equipeFrameries = isHomeMatch
                      ? match.domicile
                      : match.exterieur;
                    const adversaire = isHomeMatch
                      ? match.exterieur
                      : match.domicile;

                    return (
                      <TabsTrigger
                        key={match.id}
                        value={match.id}
                        className="text-xs py-1 px-2 h-auto"
                      >
                        vs {adversaire} - {formatDateCourte(match.date)}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {mesMatchs.map((match) => {
                  const joueurs = [
                    ...(match.joueur_dom || []),
                    ...(match.joueur_ext || []),
                  ].sort((a, b) => a.classement.localeCompare(b.classement));

                  return (
                    <TabsContent
                      key={match.id}
                      value={match.id}
                      className="mt-2"
                    >
                      <div className="space-y-2">
                        {joueurs.map((e) => {
                          const isMe = e.id === member.id;
                          const isWo = e.wo === 'y';

                          // Récupérer l'index depuis les données du joueur ou par recherche
                          const playerIndex = e.indexListeForce || 0;

                          return (
                            <div
                              key={`${match.id}-${e.id}`}
                              className={`flex items-center space-x-2 p-2 rounded-lg ${
                                isMe
                                  ? 'bg-[#F1C40F]'
                                  : isWo
                                    ? 'bg-red-50'
                                    : 'bg-[#FFF8DC]'
                              }`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(e.nom, e.prenom || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p
                                    className={`font-semibold text-sm truncate ${
                                      isMe ? 'underline font-bold' : ''
                                    } ${isWo ? 'line-through text-red-700' : ''}`}
                                  >
                                    {e.nom}
                                  </p>
                                  {isWo && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs flex items-center ml-1"
                                    >
                                      <Ban className="mr-1 h-2 w-2" /> WO
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs px-1 py-0"
                                  >
                                    {e.classement}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    Idx: {playerIndex > 0 ? playerIndex : 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : mesMatchs.length === 1 ? (
              <div>
                <div className="space-y-3">
                  {[
                    ...(mesMatchs[0].joueur_dom || []),
                    ...(mesMatchs[0].joueur_ext || []),
                  ]
                    .sort((a, b) => a.classement.localeCompare(b.classement))
                    .map((e) => {
                      const isMe = e.id === member.id;
                      const isWo = e.wo === 'y';

                      // Récupérer l'index depuis les données du joueur
                      const playerIndex = e.indexListeForce || 0;

                      return (
                        <div
                          key={`${mesMatchs[0].id}-${e.id}`}
                          className={`flex items-center space-x-3 p-3 rounded-lg ${
                            isMe
                              ? 'bg-[#F1C40F]'
                              : isWo
                                ? 'bg-red-50'
                                : 'bg-[#FFF8DC]'
                          }`}
                        >
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(e.nom, e.prenom || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className={`font-semibold ${
                                  isMe ? 'underline font-bold' : ''
                                } ${isWo ? 'line-through text-red-700' : ''}`}
                              >
                                {e.nom}
                              </p>
                              {isWo && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs flex items-center"
                                >
                                  <Ban className="mr-1 h-3 w-3" /> WO
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {e.classement}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                              >
                                Index: {playerIndex > 0 ? playerIndex : 'N/A'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center p-4">
                Aucun match prévu.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3 petits cadres : Absences, Entraînement, Menu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Calendrier des absences */}
        <Card className="bg-white border border-[#E0E0E0]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <CalendarX className="mr-2 h-4 w-4 text-red-500" />
              Calendrier absences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Bientôt disponible</p>
            </div>
          </CardContent>
        </Card>

        {/* Calendrier d'entraînement */}
        <Card className="bg-white border border-[#E0E0E0]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Dumbbell className="mr-2 h-4 w-4 text-blue-500" />
              Calendrier entraînement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Bientôt disponible</p>
            </div>
          </CardContent>
        </Card>

        {/* Menu du samedi */}
        <Card className="bg-white border border-[#E0E0E0]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <UtensilsCrossed className="mr-2 h-4 w-4 text-green-500" />
              Menu du samedi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Bientôt disponible</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal des informations du club */}
      <Dialog open={showClubInfoModal} onOpenChange={setShowClubInfoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informations - {selectedClubInfo?.clubName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Informations personnalisées (prioritaires) */}
            {selectedClubInfo?.infosPersonnalisees && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Informations exceptionnelles pour ce match
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {selectedClubInfo.infosPersonnalisees.salle && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-yellow-600" />
                      <span>
                        <strong>Salle :</strong>{' '}
                        {selectedClubInfo.infosPersonnalisees.salle}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.infosPersonnalisees.adresse && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-yellow-600" />
                      <span>
                        <strong>Adresse :</strong>{' '}
                        {selectedClubInfo.infosPersonnalisees.adresse}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.infosPersonnalisees.horaire && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>
                        <strong>Horaire :</strong>{' '}
                        {selectedClubInfo.infosPersonnalisees.horaire}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.infosPersonnalisees.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-yellow-600" />
                      <span>
                        <strong>Tél :</strong>{' '}
                        {selectedClubInfo.infosPersonnalisees.telephone}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.infosPersonnalisees.email && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Mail className="h-4 w-4 text-yellow-600" />
                      <span>
                        <strong>Email :</strong>{' '}
                        {selectedClubInfo.infosPersonnalisees.email}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.infosPersonnalisees.commentaire && (
                    <div className="md:col-span-2">
                      <p className="text-yellow-800">
                        <strong>Remarque :</strong>{' '}
                        {selectedClubInfo.infosPersonnalisees.commentaire}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations générales du club */}
            {selectedClubInfo?.clubInfo ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">
                  Informations générales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {selectedClubInfo.clubInfo.localite && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>
                        <strong>Localité :</strong>{' '}
                        {selectedClubInfo.clubInfo.localite}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.clubInfo.salle && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>
                        <strong>Salle :</strong>{' '}
                        {selectedClubInfo.clubInfo.salle}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.clubInfo.adresse && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>
                        <strong>Adresse :</strong>{' '}
                        {selectedClubInfo.clubInfo.adresse}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.clubInfo.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>
                        <strong>Téléphone :</strong>{' '}
                        {selectedClubInfo.clubInfo.telephone}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.clubInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>
                        <strong>Email :</strong>{' '}
                        {selectedClubInfo.clubInfo.email}
                      </span>
                    </div>
                  )}
                  {selectedClubInfo.clubInfo.site && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span>
                        <strong>Site web :</strong>
                        <a
                          href={selectedClubInfo.clubInfo.site}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline ml-1"
                        >
                          {selectedClubInfo.clubInfo.site}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              !selectedClubInfo?.infosPersonnalisees && (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune information disponible pour ce club</p>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
