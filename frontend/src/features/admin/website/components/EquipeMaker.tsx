/* eslint-disable */
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SelectionsManager } from '@/features/admin/website/components/content/teamsResults/SelectionsManager.tsx';
import { SerieSelector } from '@/features/admin/website/components/content/teamsResults/SeriesSelector.tsx';
import { WeekSelector } from '@/features/admin/website/components/content/teamsResults/WeeksSelector.tsx';
import { createSaison, fetchInformations, fetchSaisonEnCours, fetchUsers, updateSaisonResults } from '@/services/api';
import { fetchMatches, fetchMergedUIMatchesForClub } from '@/services/tabt';
import { Match, Member, Saison, Serie } from '@/services/type.ts';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle,
  ClipboardCopy,
  Info,
  Loader2,
  RefreshCw,
  Save,
  Target,
  Trophy,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function AdminResults() {
  // --- Helper robust pour détecter notre club dans un label d'équipe TABT ---
  const CLUB_KEYWORD = (import.meta.env.VITE_TABT_CLUB_KEYWORD as string)?.toLowerCase() || 'frameries';
  const isClubTeam = useCallback((teamLabel?: string) => {
    if (!teamLabel) return false;
    return teamLabel.toLowerCase().includes(CLUB_KEYWORD);
  }, [CLUB_KEYWORD]);
  const hasTeamLetter = useCallback((teamLabel?: string) => {
    if (!teamLabel) return false;
    return /\s[A-Z]$/.test(teamLabel.trim());
  }, []);

  const [saison, setSaison] = useState<Saison | null>(null);
  const [membres, setMembres] = useState<Member[]>([]);
  const [serieSelectionnee, setSerieSelectionnee] = useState<string>('');
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<number>(1);
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  // Nouvel état optimiste
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasLoadingError, setHasLoadingError] = useState(false);

  const [, setSelections] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [facebookShareMessage, setFacebookShareMessage] = useState('');
  const [groupId, setGroupId] = useState('1414350289649865'); // Valeur par défaut
  const [isMessageCopied, setIsMessageCopied] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('Bonjour @tout le monde\n\n📢 Les sélections pour la semaine {semaine} sont disponibles ! 🏓\n\nChaque membre peut consulter sa sélection personnelle et les compositions d\'équipes complètes dans son espace personnel sur notre site :\n🔗 https://cttframeries.com\n\nN\'oubliez pas de vérifier régulièrement vos sélections, et notez qu\'elles peuvent être mises à jour jusqu\'au jour de la rencontre.\n\nEn cas de problème ou si vous ne pouvez pas participer à une rencontre, merci de contacter rapidement un membre du comité.\n\nBonne semaine à tous et bon match ! 🏓');
  const [messageTemplateVeteran, setMessageTemplateVeteran] = useState('Bonjour @tout le monde\n\n🏓 Sélections vétérans pour la semaine {semaine} ! 🏓\n\nChaque membre peut consulter sa sélection personnelle dans son espace personnel sur notre site :\n🔗 https://cttframeries.com\n\nN\'hésitez pas à vérifier régulièrement vos sélections.\n\nEn cas de problème ou d\'indisponibilité, contactez rapidement un membre du comité.\n\nBonne semaine et bon jeu ! 🏓');
  const [selectedMessageType, setSelectedMessageType] = useState<'regular' | 'veteran'>('regular');

  // Définir serieSelectionneeData au début du composant pour éviter l'erreur TS2448
  const serieSelectionneeData = useMemo(() => {
    if (!saison || !serieSelectionnee) return null;
    return saison.series.find((s) => s.id === serieSelectionnee);
  }, [saison, serieSelectionnee]);

  // Nouvelles références pour stocker les valeurs précédentes des filtres
  const previousSerieRef = useRef<string>('');
  const previousSemaineRef = useRef<number>(1);

  // Fonction pour trouver la dernière semaine avec sélections pour une série donnée
  const findLastWeekWithSelections = useCallback((serieId: string, matchsData: Match[]) => {
    if (!serieId || !matchsData.length) return 0; // 0 si aucune selection

    const matchsSerie = matchsData.filter(m => m.serieId === serieId);

    // Grouper les matchs par semaine
    const matchsParSemaine = matchsSerie.reduce((acc, match) => {
      if (!acc[match.semaine]) {
        acc[match.semaine] = [];
      }
      acc[match.semaine].push(match);
      return acc;
    }, {} as Record<number, Match[]>);

    // Trouver la dernière semaine avec des sélections
    let lastWeekWithSelections = 0;

    Object.keys(matchsParSemaine)
      .map(Number)
      .sort((a, b) => b - a) // Trier par ordre décroissant
      .forEach(semaine => {
        const matchsSemaine = matchsParSemaine[semaine];

        // Vérifier s'il y a des sélections dans cette semaine
        const hasSelections = matchsSemaine.some(match => {
          // Vérifier si notre club joue et a des joueurs sélectionnés
          if (isClubTeam(match.domicile)) {
            return (match.joueursDomicile && match.joueursDomicile.length > 0) ||
                   (match.joueur_dom && match.joueur_dom.length > 0);
          }
          if (isClubTeam(match.exterieur)) {
            return (match.joueursExterieur && match.joueursExterieur.length > 0) ||
                   (match.joueur_ext && match.joueur_ext.length > 0);
          }
          return false;
        });

        if (hasSelections && semaine > lastWeekWithSelections) {
          lastWeekWithSelections = semaine;
        }
      });

    console.log(`Dernière semaine avec sélections pour série ${serieId}: ${lastWeekWithSelections}`);
    return lastWeekWithSelections;
  }, [isClubTeam]);

  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      try {
        setIsInitialLoading(true);
        setHasLoadingError(false);

        const [membresData, saisonEnCours, mergedTabt] = await Promise.all([
          fetchUsers(),
          fetchSaisonEnCours(),
          fetchMergedUIMatchesForClub(),
        ]);

        setMembres(membresData);

        let saisonActive = saisonEnCours;

        // Auto-créer une saison minimale si aucune n'existe
        if (!saisonActive) {
          const now = new Date();
          const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; // saison sportive
          const saisonLabel = `Saison ${y}-${y + 1}`;
          saisonActive = await createSaison({
            label: saisonLabel,
            statut: 'En cours',
            equipesClub: [],
            series: [],
            calendrier: [],
            clubs: [],
            infosPersonnalisees: [],
          });
        }

        if (saisonActive) {
          // Dériver les séries depuis TABT (divisionId/divisionName)
          const clubCode = (import.meta.env.VITE_TABT_CLUB_CODE as string) || 'H442';
          const rawTabt = await fetchMatches({ club: clubCode, showDivisionName: 'short' });
          const divisions = new Map<string, string>();
          (rawTabt.data || []).forEach((m) => {
            const id = String(m.divisionId || '');
            if (!id) return;
            const name = m.divisionName || id;
            if (!divisions.has(id)) divisions.set(id, name);
          });
          const derivedSeries: Serie[] = Array.from(divisions.entries()).map(([id, nom]) => ({
            id,
            nom,
            saisonId: saisonActive.id,
            equipes: [],
          }));

          const saisonForSelections: Saison = {
            ...saisonActive,
            series: derivedSeries,
            calendrier: Array.isArray(saisonActive.calendrier) ? saisonActive.calendrier : [],
          };

          setSaison(saisonForSelections);
          setMatchs(mergedTabt as unknown as Match[]);
          setIsSelecting(false);
          setHasLoadingError(false);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setHasLoadingError(true);
        setIsSelecting(true);
      } finally {
        setIsInitialLoading(false);
      }
    };

    chargerDonneesInitiales();
  }, [findLastWeekWithSelections]);

  // Effet: quand la série change, ne pas réinitialiser la semaine
  // On se contente d'effacer les sélections locales pour éviter les incohérences
  useEffect(() => {
    if (serieSelectionnee) {
      setSelections({});
    }
  }, [serieSelectionnee]);

  // Effet pour réinitialiser les sélections quand les filtres changent (sauf au premier rendu)
  useEffect(() => {
    if (serieSelectionnee && semaineSelectionnee) {
      // noop
    }
  }, [semaineSelectionnee]);

  // Utiliser useMemo pour calculer les matchs filtrés
  const matchsSemaine = useMemo(() => {
    if (!saison) return [];

    // Récupérer TOUS les matchs de la série et semaine (pas seulement notre club)
    return matchs
      .filter((m) => m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee)
      .map(match => ({
        ...match,
        saisonId: saison.id // S'assurer que saisonId est toujours défini
      }));
  }, [matchs, serieSelectionnee, semaineSelectionnee, saison]);

  const updateMatch = (matchId: string, updates: Partial<Match>) => {
    setMatchs((prev) =>
      prev.map((match) => {
        if (match.id === matchId) {
          const updatedMatch = { ...match, ...updates };

          // Synchroniser les deux formats de joueurs pour la compatibilité
          if (updates.joueursDomicile) {
            updatedMatch.joueur_dom = updates.joueursDomicile;
          }
          if (updates.joueursExterieur) {
            updatedMatch.joueur_ext = updates.joueursExterieur;
          }
          if (updates.joueur_dom) {
            updatedMatch.joueursDomicile = updates.joueur_dom;
          }
          if (updates.joueur_ext) {
            updatedMatch.joueursExterieur = updates.joueur_ext;
          }

          // Gérer les scores individuels
          if (updates.scoresIndividuels) {
            updatedMatch.scoresIndividuels = {
              ...updatedMatch.scoresIndividuels,
              ...updates.scoresIndividuels,
            };
          }

          // S'assurer que le champ scoresIndividuels existe toujours
          if (!updatedMatch.scoresIndividuels) {
            updatedMatch.scoresIndividuels = {};
          }

          console.log(`Match ${matchId} mis à jour:`, updatedMatch);
          return updatedMatch;
        }
        return match;
      })
    );
  };

  // Memoize handleSelectionsChange pour éviter la recréation à chaque rendu
  const handleSelectionsChange = useCallback((newSelections: Record<string, string[]>) => {
    setSelections((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(newSelections)) {
        return prev;
      }
      return newSelections;
    });
  }, []);

  // Ajouter un effet pour écouter les mises à jour des matchs depuis SelectionsManager
  useEffect(() => {
    const handleMatchUpdate = (event: CustomEvent) => {
      const { matchId, updates } = event.detail;
      console.log('Réception mise à jour match dans EquipeMaker:', matchId, updates);

      // S'assurer que les joueurs ont le champ wo défini
      if (updates.joueursDomicile) {
        updates.joueursDomicile = updates.joueursDomicile.map((j: any) => ({
          ...j,
          wo: j.wo || "n"
        }));
      }
      if (updates.joueursExterieur) {
        updates.joueursExterieur = updates.joueursExterieur.map((j: any) => ({
          ...j,
          wo: j.wo || "n"
        }));
      }
      if (updates.joueur_dom) {
        updates.joueur_dom = updates.joueur_dom.map((j: any) => ({
          ...j,
          wo: j.wo || "n"
        }));
      }
      if (updates.joueur_ext) {
        updates.joueur_ext = updates.joueur_ext.map((j: any) => ({
          ...j,
          wo: j.wo || "n"
        }));
      }

      updateMatch(matchId, updates);
    };

    window.addEventListener('updateMatch', handleMatchUpdate as EventListener);

    return () => {
      window.removeEventListener('updateMatch', handleMatchUpdate as EventListener);
    };
  }, []);

  // Fonction de sauvegarde (extraite pour réutilisation)
  const saveCurrentData = useCallback(async (isAutoSave = false) => {
    if (!saison || !serieSelectionnee) return true;

    const setSavingState = isAutoSave ? setIsAutoSaving : setIsSaving;

    setSavingState(true);
    try {
      console.log('=== DÉBUT SAUVEGARDE ===');
      console.log('État actuel des matchs avant sauvegarde:', matchs);

      // Préparer les matchs avec les sélections ET les scores pour updateSaisonResults
      const matchsSemaine = matchs.filter(
        (m) =>
          m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
      );

      console.log('Matchs de la semaine filtrés:', matchsSemaine);

      const matchesWithUpdatedData = matchsSemaine.map((match) => {
        console.log(`\n--- Traitement match ${match.id} ---`);
        console.log('Match original avant traitement:', JSON.stringify(match, null, 2));

        // Utiliser directement les joueurs du match qui contiennent déjà les infos WO
        let joueursAvecWO: any[] = [];

        if (isClubTeam(match.domicile)) {
          joueursAvecWO = match.joueursDomicile || match.joueur_dom || [];
          console.log('Joueurs domicile (club) trouvés:', joueursAvecWO);
        } else if (isClubTeam(match.exterieur)) {
          joueursAvecWO = match.joueursExterieur || match.joueur_ext || [];
          console.log('Joueurs extérieur (club) trouvés:', joueursAvecWO);
        }

        // S'assurer que tous les joueurs ont un champ wo défini
        joueursAvecWO = joueursAvecWO.map(joueur => ({
          ...joueur,
          wo: joueur.wo || "n"
        }));

        // Préparer le match avec TOUTES les données mises à jour
        let matchWithUpdatedData = {
          ...match,
          saisonId: saison.id,
          score: match.score || '',
          scoresIndividuels: match.scoresIndividuels ? { ...match.scoresIndividuels } : {},
        } as Match;

        // S'assurer que les joueurs WO ont un score de 0
        joueursAvecWO.forEach(joueur => {
          if (joueur.wo === "y") {
            matchWithUpdatedData.scoresIndividuels![joueur.id] = 0;
            console.log(`Score forcé à 0 pour joueur WO: ${joueur.nom}`);
          }
        });

        // Déterminer si notre club joue à domicile ou à l'extérieur
        if (isClubTeam(match.domicile)) {
          matchWithUpdatedData = {
            ...matchWithUpdatedData,
            joueursDomicile: joueursAvecWO,
            joueur_dom: joueursAvecWO,
          } as Match;
          console.log('Joueurs domicile finaux pour sauvegarde:', joueursAvecWO);
        } else if (isClubTeam(match.exterieur)) {
          matchWithUpdatedData = {
            ...matchWithUpdatedData,
            joueursExterieur: joueursAvecWO,
            joueur_ext: joueursAvecWO,
          } as Match;
          console.log('Joueurs extérieur finaux pour sauvegarde:', joueursAvecWO);
        } else {
          // Pour les matchs sans notre club, s'assurer que wo est défini
          matchWithUpdatedData = {
            ...matchWithUpdatedData,
            joueur_dom: (match.joueur_dom || []).map(j => ({
              ...j,
              wo: j.wo || "n"
            })),
            joueur_ext: (match.joueur_ext || []).map(j => ({
              ...j,
              wo: j.wo || "n"
            })),
          } as Match;
        }

        console.log('Match final pour sauvegarde:', JSON.stringify(matchWithUpdatedData, null, 2));
        return matchWithUpdatedData;
      });

      console.log('\n=== ENVOI À updateSaisonResults ===');
      console.log('Tous les matches pour sauvegarde:', JSON.stringify(matchesWithUpdatedData, null, 2));

      // Utiliser updateSaisonResults pour sauvegarder
      await updateSaisonResults(saison.id, matchesWithUpdatedData);

      if (!isAutoSave) {
        setSaveMessage({
          type: 'success',
          message: 'Sélections et scores sauvegardés avec succès !',
        });
        setTimeout(() => setSaveMessage(null), 3000);
      }

      console.log('=== SAUVEGARDE TERMINÉE AVEC SUCCÈS ===');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      if (!isAutoSave) {
        setSaveMessage({
          type: 'error',
          message: 'Erreur lors de la sauvegarde',
        });
        setTimeout(() => setSaveMessage(null), 3000);
      }
      return false;
    } finally {
      setSavingState(false);
    }
  }, [saison, serieSelectionnee, semaineSelectionnee, matchs, isClubTeam]);

  // Gestionnaire pour le changement de série avec sauvegarde automatique
  const handleSerieChange = useCallback(async (newSerieId: string) => {
    // Sauvegarde auto avant changement
    if (previousSerieRef.current && previousSerieRef.current !== newSerieId) {
      console.log('Sauvegarde automatique avant changement de série...');
      setIsAutoSaving(true);
      await saveCurrentData(true);
      setIsAutoSaving(false);
    }

    // Déterminer s'il s'agit de la première sélection de série
    const isFirstSerieSelection = !previousSerieRef.current;

    setSerieSelectionnee(newSerieId);

    // Si première sélection de la série ET l'utilisateur n'a pas encore choisi la semaine,
    // définir par défaut: une semaine après la dernière semaine avec sélections (max 22, min 1)
    if (isFirstSerieSelection && saison) {
      const lastWithSel = findLastWeekWithSelections(newSerieId, saison.calendrier || []);
      const proposed = lastWithSel > 0 ? Math.min(22, lastWithSel + 1) : 1;
      setSemaineSelectionnee(proposed);
      previousSemaineRef.current = proposed;
    }

    // Ne pas modifier la semaine lorsqu'on change de division après la première fois
    previousSerieRef.current = newSerieId;
  }, [saveCurrentData, saison, findLastWeekWithSelections]);

  // Gestionnaire pour le changement de semaine avec sauvegarde automatique
  const handleSemaineChange = useCallback(async (newSemaine: number) => {
    if (previousSemaineRef.current && previousSemaineRef.current !== newSemaine && serieSelectionnee) {
      console.log('Sauvegarde automatique avant changement de semaine...');
      setIsAutoSaving(true);
      await saveCurrentData(true);
      setIsAutoSaving(false);
    }

    setSemaineSelectionnee(newSemaine);
    previousSemaineRef.current = newSemaine;
  }, [saveCurrentData, serieSelectionnee]);

  // Effet pour mettre à jour les références lors des changements
  useEffect(() => {
    previousSerieRef.current = serieSelectionnee;
    previousSemaineRef.current = semaineSelectionnee;
  }, [serieSelectionnee, semaineSelectionnee]);

  // Fonction de sauvegarde manuelle
  const handleSaveData = async () => {
    await saveCurrentData(false);
  };

  // Fonction pour déterminer si la série est vétéran (pour la détection automatique initiale)
  const isVeteranSerie = useCallback((serie: any) => {
    if (!serie) return false;
    const nomSerie = serie.nom.toLowerCase();
    return nomSerie.includes('vétéran') || nomSerie.includes('veteran');
  }, []);

  // Fonction pour générer le message de partage Facebook
  const generateFacebookShareMessage = useCallback(() => {
    const template = selectedMessageType === 'veteran' ? messageTemplateVeteran : messageTemplate;
    return template.replace(/{semaine}/g, semaineSelectionnee.toString());
  }, [messageTemplate, messageTemplateVeteran, semaineSelectionnee, selectedMessageType]);

  // Fonction pour ouvrir le dialogue de partage avec le message pré-rempli
  const handleOpenShareDialog = useCallback(() => {
    const autoDetectedType = isVeteranSerie(serieSelectionneeData) ? 'veteran' : 'regular';
    setSelectedMessageType(autoDetectedType);

    setFacebookShareMessage(generateFacebookShareMessage());
    setIsMessageCopied(false);
    setIsShareDialogOpen(true);
  }, [generateFacebookShareMessage, isVeteranSerie, serieSelectionneeData]);

  // Effet pour régénérer le message quand le type change
  useEffect(() => {
    if (isShareDialogOpen) {
      setFacebookShareMessage(generateFacebookShareMessage());
    }
  }, [selectedMessageType, generateFacebookShareMessage, isShareDialogOpen]);

  // Effet pour charger l'ID du groupe Facebook et les messages par défaut depuis les informations générales
  useEffect(() => {
    const loadFacebookConfig = async () => {
      try {
        const infosData = await fetchInformations();
        if (infosData && infosData.length > 0) {
          if (infosData[0].facebookGroupePriveUrl) {
            const url = infosData[0].facebookGroupePriveUrl;
            const match = url.match(/groups\/(\d+)/);
            if (match && match[1]) {
              setGroupId(match[1]);
              console.log('ID du groupe Facebook chargé:', match[1]);
            }
          }

          if (infosData[0].facebookMessageDefaut) {
            setMessageTemplate(infosData[0].facebookMessageDefaut);
            console.log('Message par défaut Facebook chargé');
          }

          if (infosData[0].facebookMessageVeteran) {
            setMessageTemplateVeteran(infosData[0].facebookMessageVeteran);
            console.log('Message vétéran Facebook chargé');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration Facebook:', error);
      }
    };

    loadFacebookConfig();
  }, []);

  // Fonction pour copier le message et ouvrir Facebook
  const handleCopyAndOpenFacebook = useCallback(() => {
    // Copier le message dans le presse-papiers
    navigator.clipboard.writeText(facebookShareMessage)
      .then(() => {
        setIsMessageCopied(true);

        // Ouvrir Facebook dans un nouvel onglet avec l'ID du groupe dynamique
        window.open(
          `https://www.facebook.com/groups/${groupId}`,
          '_blank'
        );

        // Fermer automatiquement le dialogue après 1 seconde
        setTimeout(() => {
          setIsShareDialogOpen(false);
          // Réinitialiser l'état de copie après fermeture
          setTimeout(() => setIsMessageCopied(false), 500);
        }, 1000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie du message:', err);
      });
  }, [facebookShareMessage, groupId]);

  // Nouvelles fonctions pour toutes les équipes
  const toutesLesEquipes = useMemo(() => {
    if (!saison || !semaineSelectionnee) return [];

    // Récupérer tous les matchs de la semaine sélectionnée où notre club joue
    const matchsCttFrameries = matchs.filter(
      (match) =>
        match.semaine === semaineSelectionnee &&
        (isClubTeam(match.domicile) || isClubTeam(match.exterieur))
    );

    // Créer un Map pour grouper par équipe notre club
    // Correction : clé unique par équipe ET série
    const equipesMap = new Map<string, {
      equipe: string;
      serie: string;
      serieId: string;
      match?: any;
      joueurs: any[];
      estDomicile: boolean;
    }>();

    // Traiter les matchs avec compositions
    matchsCttFrameries.forEach(match => {
      const serie = saison.series.find(s => s.id === match.serieId);
      if (!serie) return;

      let joueurs: any[] = [];
      let estDomicile = false;
      let equipeFrameries = '';

      if (isClubTeam(match.domicile)) {
        joueurs = match.joueursDomicile || match.joueur_dom || [];
        estDomicile = true;
        equipeFrameries = match.domicile;
      } else if (isClubTeam(match.exterieur)) {
        joueurs = match.joueursExterieur || match.joueur_ext || [];
        estDomicile = false;
        equipeFrameries = match.exterieur;
      }

      // Filtrer: afficher uniquement les équipes avec lettre (A, B, C, …)
      if (!hasTeamLetter(equipeFrameries)) return;

      // Correction : clé unique par équipe ET série
      if (equipeFrameries) {
        const key = `${equipeFrameries}__${serie.id}`;
        equipesMap.set(key, {
          equipe: equipeFrameries,
          serie: serie.nom,
          serieId: serie.id,
          match: {
            id: match.id,
            domicile: match.domicile,
            exterieur: match.exterieur,
            date: match.date,
            heure: match.heure,
            lieu: match.lieu
          },
          joueurs,
          estDomicile
        });
      }
    });

    // Ajouter les équipes du club qui n'ont pas encore de match cette semaine
    saison.equipesClub.forEach(equipeClub => {
      // Filtrer: uniquement les équipes avec lettre
      if (!hasTeamLetter(equipeClub.nom)) return;

      // Correction : clé unique par équipe ET série
      const key = `${equipeClub.nom}__${equipeClub.serieId}`;
      // Vérifier si cette équipe a déjà un match cette semaine
      const aDejaMatch = equipesMap.has(key);

      if (!aDejaMatch && equipeClub.serieId) {
        const serie = saison.series.find(s => s.id === equipeClub.serieId);
        if (serie) {
          equipesMap.set(key, {
            equipe: equipeClub.nom,
            serie: serie.nom,
            serieId: serie.id,
            joueurs: [],
            estDomicile: true // Valeur par défaut
          });
        }
      }
    });

    // Convertir en array et trier par type (Homme/Vétéran) puis lettre puis série
    const extractLetter = (nom: string) => {
      const tokens = nom.trim().split(/\s+/);
      const last = tokens[tokens.length - 1] || '';
      return /^[A-Za-z]$/.test(last) ? last.toUpperCase() : '';
    };
    const isVeteran = (serie: string) => {
      const s = serie.toLowerCase();
      return s.includes('vétéran') || s.includes('veteran');
    };
    return Array.from(equipesMap.values()).sort((a, b) => {
      // Trier d'abord par type (Homme avant Vétéran)
      const typeA = isVeteran(a.serie) ? 1 : 0;
      const typeB = isVeteran(b.serie) ? 1 : 0;
      if (typeA !== typeB) return typeA - typeB;
      // Puis par lettre d'équipe
      const letterA = extractLetter(a.equipe);
      const letterB = extractLetter(b.equipe);
      if (letterA !== letterB) return letterA.localeCompare(letterB);
      // Enfin par nom de série
      return a.serie.localeCompare(b.serie);
    });
  }, [saison, matchs, semaineSelectionnee, isClubTeam, hasTeamLetter]);


  // Condition d'affichage optimiste
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header optimiste */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <Badge variant="outline" className="bg-white animate-pulse">
                <CalendarDays className="h-4 w-4 mr-1" />
                Chargement...
              </Badge>
              <Badge variant="default" className="animate-pulse">
                En cours
              </Badge>
              <Badge variant="outline" className="bg-white animate-pulse">
                Chargement des données...
              </Badge>
            </div>
          </div>

          {/* Card de chargement optimiste */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Chargement des sélections
                <Badge variant="outline" className="ml-2 text-xs animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Initialisation...
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Skeleton loaders pour les sélecteurs */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1 h-10 bg-gray-100 rounded animate-pulse"></div>
                  <div className="flex-1 h-10 bg-blue-100 rounded animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message optimiste */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Chargement de la saison en cours...
              </h3>
              <p className="text-gray-500">
                Récupération des données TABT et des équipes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Affichage d'erreur uniquement si on a confirmé qu'il n'y a pas de saison
  if (hasLoadingError || (isSelecting && !isInitialLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {hasLoadingError ? "Erreur de chargement" : "Aucune saison en cours"}
              </h3>
              <p className="text-gray-500 mb-4">
                {hasLoadingError
                  ? "Impossible de charger les données. Vérifiez votre connexion."
                  : "Veuillez démarrer une saison pour accéder à cette interface"
                }
              </p>
              {hasLoadingError && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Affichage normal si saison existe
  if (!saison) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Initialisation en cours...
              </h3>
              <p className="text-gray-500">
                Préparation de l'interface de sélection
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <Badge variant="outline" className="bg-white">
                <CalendarDays className="h-4 w-4 mr-1" />
                {saison.label}
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Sélection
                {isAutoSaving && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Sauvegarde auto...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SerieSelector
                  series={saison.series}
                  selectedSerie={serieSelectionnee}
                  onSerieChange={handleSerieChange}
                />
                <WeekSelector
                  selectedWeek={semaineSelectionnee}
                  onWeekChange={handleSemaineChange}
                  disabled={!serieSelectionnee || isAutoSaving}
                  maxWeeks={22}
                />
                {/* Change: make buttons stack on mobile to avoid overflow */}
                <div className="flex flex-col sm:flex-row items-end gap-2">
                  <Button
                    onClick={handleSaveData}
                    disabled={!serieSelectionnee || isSaving || isAutoSaving}
                    className="w-full sm:flex-1"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>

                  <Button
                    onClick={handleOpenShareDialog}
                    disabled={!serieSelectionnee}
                    variant="outline"
                    className="w-full sm:flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#1877F2"
                      className="mr-2"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Publier
                  </Button>
                </div>
              </div>

              {saveMessage && (
                <Alert
                  variant={
                    saveMessage.type === 'success' ? 'default' : 'destructive'
                  }
                  className="mt-4"
                >
                  {saveMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{saveMessage.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Content */}
          {serieSelectionnee && (
            <Tabs defaultValue="selections" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm">
                <TabsTrigger
                  value="selections"
                  className="flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Sélections
                </TabsTrigger>
                <TabsTrigger value="toutes-equipes" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Toutes les équipes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="selections" className="space-y-4">
                {serieSelectionneeData && (
                  <SelectionsManager
                    serie={serieSelectionneeData}
                    semaine={semaineSelectionnee}
                    membres={membres}
                    matchs={matchsSemaine}
                    onSelectionsChange={handleSelectionsChange}
                  />
                )}
              </TabsContent>

              <TabsContent value="toutes-equipes" className="space-y-4">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                      <Users className="h-6 w-6 text-blue-600" />
                      Toutes les équipes CTT Frameries - Semaine {semaineSelectionnee}
                    </CardTitle>
                    <p className="text-center text-sm text-gray-600">
                      Vue d'ensemble de toutes les équipes du club pour cette semaine (y compris les équipes sans composition)
                    </p>
                  </CardHeader>
                  <CardContent>
                    {toutesLesEquipes.length > 0 ? (
                      <div className="space-y-6">
                        {toutesLesEquipes.map((equipe, index) => (
                          <Card
                            key={`${equipe.serieId}-${equipe.equipe}-${index}`}
                            className={`border ${
                              equipe.joueurs.length === 0 
                                ? 'border-orange-200 bg-orange-50' 
                                : 'border-gray-200'
                            }`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between min-w-0">
                                <CardTitle className="text-lg text-blue-700 truncate">
                                  {equipe.equipe}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {equipe.serie}
                                  </Badge>
                                  {equipe.match && (
                                    <Badge variant={equipe.estDomicile ? "default" : "secondary"}>
                                      {equipe.estDomicile ? "Domicile" : "Extérieur"}
                                    </Badge>
                                  )}
                                  {equipe.joueurs.length === 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      Équipe vide
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {equipe.match ? (
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <strong>Match:</strong> {equipe.match.domicile} vs {equipe.match.exterieur}
                                  </div>
                                  {equipe.match.date && (
                                    <div className="flex items-center gap-2">
                                      <CalendarDays className="h-4 w-4" />
                                      {new Date(equipe.match.date).toLocaleDateString('fr-FR')}
                                      {equipe.match.heure && <span>à {equipe.match.heure}</span>}
                                    </div>
                                  )}
                                  {equipe.match.lieu && (
                                    <div className="text-xs text-gray-500">
                                      📍 {equipe.match.lieu}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-orange-600">
                                  <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    Aucun match programmé pour la semaine {semaineSelectionnee}
                                  </div>
                                </div>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Composition ({equipe.joueurs.length} joueur{equipe.joueurs.length > 1 ? 's' : ''})
                                </h4>

                                {equipe.joueurs.length > 0 ? (
                                  <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {equipe.joueurs.map((joueur, jIndex) => {
                                        const membre = membres.find(m => m.id === joueur.id);
                                        return (
                                          <div
                                            key={`${joueur.id}-${jIndex}`}
                                            className={`flex items-center gap-2 p-2 rounded-lg border ${
                                              joueur.wo === "y" 
                                                ? 'bg-red-50 border-red-200 text-red-700' 
                                                : 'bg-gray-50 border-gray-200'
                                            }`}
                                          >
                                            <div className="flex-1">
                                              <div className="font-medium text-sm">
                                                {membre ? `${membre.nom} ${membre.prenom}` : joueur.nom}
                                              </div>
                                              {membre?.classement && (
                                                <div className="text-xs text-gray-500">
                                                  {membre.classement}
                                                </div>
                                              )}
                                            </div>
                                            {joueur.wo === "y" && (
                                              <Badge variant="destructive" className="text-xs">
                                                WO
                                              </Badge>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {equipe.joueurs.filter(j => j.wo === "y").length > 0 && (
                                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                        ⚠️ {equipe.joueurs.filter(j => j.wo === "y").length} joueur(s) en forfait (WO)
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-center py-8 text-orange-600 bg-orange-50 rounded-lg border border-orange-200">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="font-medium">Aucune composition définie</p>
                                    <p className="text-sm text-orange-500 mt-1">
                                      {equipe.match
                                        ? "Les joueurs doivent encore être sélectionnés pour ce match"
                                        : "Aucun match programmé pour cette semaine"
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Aucune équipe trouvée</p>
                        <p className="text-sm">pour la semaine {semaineSelectionnee}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* État vide */}
          {!serieSelectionnee && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Sélectionnez une série
                </h3>
                <p className="text-gray-500">
                  Choisissez une série pour commencer les sélections ou voir toutes les équipes
                </p>
              </CardContent>
            </Card>
          )}

          {/* Dialogue de partage Facebook */}
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Publier sur le groupe Facebook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="#1877F2"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <p className="text-sm text-gray-600">
                    Personnalisez votre message avant de le publier
                  </p>
                </div>

                {/* Sélecteur de type de message */}
                <div className="space-y-3">
                  <Label>Type de message</Label>
                  <div className="flex space-x-4">
                    <Button
                      variant={selectedMessageType === 'regular' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMessageType('regular')}
                      className="flex items-center"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Équipes régulières
                    </Button>
                    <Button
                      variant={selectedMessageType === 'veteran' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMessageType('veteran')}
                      className="flex items-center"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Équipes vétérans
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-message">Message à publier</Label>
                  <Textarea
                    id="fb-message"
                    value={facebookShareMessage}
                    onChange={(e) => setFacebookShareMessage(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div className="rounded-md bg-blue-50 p-3">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-blue-700 text-sm">
                      <p className="font-medium mb-1">Comment publier facilement :</p>
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Choisissez le type de message approprié</li>
                        <li>Cliquez sur le bouton "Copier et ouvrir Facebook"</li>
                        <li>Le message sera automatiquement copié</li>
                        <li>Collez le message (Ctrl+V) dans la fenêtre de publication Facebook qui s'ouvre</li>
                      </ol>
                      <p className="mt-2 text-xs">
                        Groupe configuré: ID {groupId}
                      </p>
                      <p className="mt-1 text-xs">
                        Type de message: {selectedMessageType === 'veteran' ? 'Vétéran' : 'Équipes régulières'}
                        {serieSelectionneeData && isVeteranSerie(serieSelectionneeData) && (
                          <span className="text-orange-600"> (série vétéran détectée automatiquement)</span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-green-600">
                        💡 Le message commence par "Bonjour @tout le monde" pour notifier tous les membres du groupe
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                <DialogClose asChild>
                  <Button variant="secondary">Annuler</Button>
                </DialogClose>
                <Button
                  onClick={handleCopyAndOpenFacebook}
                  className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
                >
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
      </div>
    </TooltipProvider>
  );
}
