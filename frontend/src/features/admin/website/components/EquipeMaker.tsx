/* eslint-disable */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CalendarDays,
  Trophy,
  Target,
  UserCheck,
  BarChart3,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  Share2,
  PencilIcon,
  Users,
  User,
  ClipboardCopy,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectionsManager } from '@/features/admin/website/components/content/teamsResults/SelectionsManager.tsx';
import { MatchCard } from '@/features/admin/website/components/content/teamsResults/MatchCard.tsx';
import { SerieSelector } from '@/features/admin/website/components/content/teamsResults/SeriesSelector.tsx';
import { WeekSelector } from '@/features/admin/website/components/content/teamsResults/WeeksSelector.tsx';
import { Saison, Member, Match } from '@/services/type.ts';
import { fetchSaisons, fetchUsers, updateSaisonResults, fetchInformations } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AdminResults() {
  const [allSaisons, setAllSaisons] = useState<Saison[]>([]);
  const [saison, setSaison] = useState<Saison | null>(null);
  const [membres, setMembres] = useState<Member[]>([]);
  const [serieSelectionnee, setSerieSelectionnee] = useState<string>('');
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<number>(1);
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [facebookShareMessage, setFacebookShareMessage] = useState('');
  const [shareDestination, setShareDestination] = useState<'profile' | 'group'>('group');
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

  // Référence pour la navigation entre les champs de score
  const scoreRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Nouvelles références pour stocker les valeurs précédentes des filtres
  const previousSerieRef = useRef<string>('');
  const previousSemaineRef = useRef<number>(1);

  // Fonction pour trouver la dernière semaine avec sélections pour une série donnée
  const findLastWeekWithSelections = useCallback((serieId: string, matchsData: Match[]) => {
    if (!serieId || !matchsData.length) return 1;

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
    let lastWeekWithSelections = 1;

    Object.keys(matchsParSemaine)
      .map(Number)
      .sort((a, b) => b - a) // Trier par ordre décroissant
      .forEach(semaine => {
        const matchsSemaine = matchsParSemaine[semaine];

        // Vérifier s'il y a des sélections dans cette semaine
        const hasSelections = matchsSemaine.some(match => {
          // Vérifier si CTT Frameries joue et a des joueurs sélectionnés
          if (match.domicile.includes('CTT Frameries')) {
            return (match.joueursDomicile && match.joueursDomicile.length > 0) ||
                   (match.joueur_dom && match.joueur_dom.length > 0);
          }
          if (match.exterieur.includes('CTT Frameries')) {
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
  }, []);

  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      setIsLoading(true);
      try {
        const [saisonsData, membresData] = await Promise.all([
          fetchSaisons(),
          fetchUsers(),
        ]);

        setAllSaisons(saisonsData);
        setMembres(membresData);

        const saisonEnCours = saisonsData.find(
          (s: Saison) => s.statut === 'En cours'
        );

        if (saisonEnCours) {
          setSaison(saisonEnCours);
          setMatchs(saisonEnCours.calendrier);
          setIsSelecting(false);

          // Si on a déjà une série sélectionnée, trouver la dernière semaine avec sélections
          if (serieSelectionnee) {
            const lastWeek = findLastWeekWithSelections(serieSelectionnee, saisonEnCours.calendrier);
            setSemaineSelectionnee(lastWeek);
          }
        } else {
          setIsSelecting(true);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setIsSelecting(true);
      } finally {
        setIsLoading(false);
      }
    };

    chargerDonneesInitiales();
  }, [serieSelectionnee, findLastWeekWithSelections]);

  // Effet pour mettre à jour la semaine sélectionnée quand on change de série
  useEffect(() => {
    if (serieSelectionnee && saison?.calendrier) {
      const lastWeek = findLastWeekWithSelections(serieSelectionnee, saison.calendrier);
      setSemaineSelectionnee(lastWeek);
      // Réinitialiser les sélections quand on change de série
      setSelections({});
    }
  }, [serieSelectionnee, saison?.calendrier, findLastWeekWithSelections]);

  // Effet pour réinitialiser les sélections quand les filtres changent (sauf au premier rendu)
  useEffect(() => {
    // Ne pas réinitialiser lors du premier rendu ou changement de série (géré ci-dessus)
    if (serieSelectionnee && semaineSelectionnee) {
      // Les sélections sont déjà gérées par l'effet précédent
    }
  }, [semaineSelectionnee]);

  // Utiliser useMemo pour calculer les matchs filtrés
  const matchsSemaine = useMemo(() => {
    if (!saison) return [];

    // Récupérer TOUS les matchs de la série et semaine (pas seulement CTT Frameries)
    return matchs.filter(
      (m) => m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
    ).map(match => ({
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
      // Vérifier si les sélections ont réellement changé avant de mettre à jour l'état
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

        if (match.domicile.includes('CTT Frameries')) {
          joueursAvecWO = match.joueursDomicile || match.joueur_dom || [];
          console.log('Joueurs domicile CTT Frameries trouvés:', joueursAvecWO);
        } else if (match.exterieur.includes('CTT Frameries')) {
          joueursAvecWO = match.joueursExterieur || match.joueur_ext || [];
          console.log('Joueurs extérieur CTT Frameries trouvés:', joueursAvecWO);
        }

        // S'assurer que tous les joueurs ont un champ wo défini
        joueursAvecWO = joueursAvecWO.map(joueur => {
          const joueurAvecWO = {
            ...joueur,
            wo: joueur.wo || "n"
          };
          console.log(`Joueur ${joueur.nom}: wo = ${joueurAvecWO.wo}`);
          return joueurAvecWO;
        });

        // Préparer le match avec TOUTES les données mises à jour
        let matchWithUpdatedData = {
          ...match,
          saisonId: saison.id,
          score: match.score || '',
          scoresIndividuels: match.scoresIndividuels ? { ...match.scoresIndividuels } : {},
        };

        // S'assurer que les joueurs WO ont un score de 0
        joueursAvecWO.forEach(joueur => {
          if (joueur.wo === "y") {
            matchWithUpdatedData.scoresIndividuels![joueur.id] = 0;
            console.log(`Score forcé à 0 pour joueur WO: ${joueur.nom}`);
          }
        });

        // Déterminer si CTT Frameries joue à domicile ou à l'extérieur
        if (match.domicile.includes('CTT Frameries')) {
          matchWithUpdatedData = {
            ...matchWithUpdatedData,
            joueursDomicile: joueursAvecWO,
            joueur_dom: joueursAvecWO,
          };
          console.log('Joueurs domicile finaux pour sauvegarde:', joueursAvecWO);
        } else if (match.exterieur.includes('CTT Frameries')) {
          matchWithUpdatedData = {
            ...matchWithUpdatedData,
            joueursExterieur: joueursAvecWO,
            joueur_ext: joueursAvecWO,
          };
          console.log('Joueurs extérieur finaux pour sauvegarde:', joueursAvecWO);
        } else {
          // Pour les matchs sans CTT Frameries, s'assurer que wo est défini
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
          };
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
  }, [saison, serieSelectionnee, semaineSelectionnee, matchs]);

  // Gestionnaire pour le changement de série avec sauvegarde automatique
  const handleSerieChange = useCallback(async (newSerieId: string) => {
    // Sauvegarder les données actuelles avant de changer de série (si on avait une série sélectionnée)
    if (previousSerieRef.current && previousSerieRef.current !== newSerieId) {
      console.log('Sauvegarde automatique avant changement de série...');
      setIsAutoSaving(true);
      await saveCurrentData(true);
      setIsAutoSaving(false);
    }

    // Mettre à jour la série sélectionnée
    setSerieSelectionnee(newSerieId);
    previousSerieRef.current = newSerieId;
  }, [saveCurrentData]);

  // Gestionnaire pour le changement de semaine avec sauvegarde automatique
  const handleSemaineChange = useCallback(async (newSemaine: number) => {
    // Sauvegarder les données actuelles avant de changer de semaine (si on avait une semaine différente)
    if (previousSemaineRef.current && previousSemaineRef.current !== newSemaine && serieSelectionnee) {
      console.log('Sauvegarde automatique avant changement de semaine...');
      setIsAutoSaving(true);
      await saveCurrentData(true);
      setIsAutoSaving(false);
    }

    // Mettre à jour la semaine sélectionnée
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

  // Fonction pour la navigation entre les champs de score avec les flèches
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentMatchId: string) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();

      const matchIds = matchsSemaine.map(m => m.id);
      const currentIndex = matchIds.indexOf(currentMatchId);

      let nextIndex: number;
      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex + 1;
        if (nextIndex >= matchIds.length) {
          nextIndex = 0; // Revenir au premier
        }
      } else { // ArrowUp
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = matchIds.length - 1; // Aller au dernier
        }
      }

      const nextMatchId = matchIds[nextIndex];
      scoreRefs.current[nextMatchId?.toString()]?.focus();
    }
  }, [matchsSemaine]);

  // Fonction pour déterminer si la série est vétéran (pour la détection automatique initiale)
  const isVeteranSerie = useCallback((serie: any) => {
    if (!serie) return false;
    const nomSerie = serie.nom.toLowerCase();
    return nomSerie.includes('vétéran') || nomSerie.includes('veteran');
  }, []);

  // Fonction pour générer le message de partage Facebook
  const generateFacebookShareMessage = useCallback(() => {
    // Utiliser le type de message sélectionné manuellement
    const template = selectedMessageType === 'veteran' ? messageTemplateVeteran : messageTemplate;
    // Remplacer la variable {semaine} par le numéro de semaine actuel
    return template.replace(/{semaine}/g, semaineSelectionnee.toString());
  }, [messageTemplate, messageTemplateVeteran, semaineSelectionnee, selectedMessageType]);

  // Fonction pour ouvrir le dialogue de partage avec le message pré-rempli
  const handleOpenShareDialog = useCallback(() => {
    // Détecter automatiquement le type au moment de l'ouverture du dialogue
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
          // Charger l'ID du groupe
          if (infosData[0].facebookGroupePriveUrl) {
            const url = infosData[0].facebookGroupePriveUrl;
            const match = url.match(/groups\/(\d+)/);
            if (match && match[1]) {
              setGroupId(match[1]);
              console.log('ID du groupe Facebook chargé:', match[1]);
            }
          }

          // Charger le message par défaut régulier
          if (infosData[0].facebookMessageDefaut) {
            setMessageTemplate(infosData[0].facebookMessageDefaut);
            console.log('Message par défaut Facebook chargé');
          }

          // Charger le message par défaut vétéran
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <span className="text-lg">Chargement des données...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isSelecting || !saison) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucune saison en cours
              </h3>
              <p className="text-gray-500">
                Veuillez démarrer une saison pour accéder à cette interface
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
              <Badge
                variant={saison.statut === 'En cours' ? 'default' : 'secondary'}
              >
                {saison.statut}
              </Badge>
              <Badge variant="outline" className="bg-white">
                22 semaines • {matchs.length} matchs total
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
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleSaveData}
                    disabled={!serieSelectionnee || isSaving || isAutoSaving}
                    className="flex-1"
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
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
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

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 shrink-0"
                      >
                        <Info className="h-4 w-4 text-gray-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-4" align="center">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Codes de résultats spéciaux :</h4>
                        <div className="text-xs space-y-1">
                          <div><strong>bye</strong> - Match contre BYE</div>
                          <div><strong>ff-d</strong> - Forfait équipe domicile</div>
                          <div><strong>ff-e</strong> - Forfait équipe extérieur</div>
                          <div><strong>fg-d</strong> - Forfait général domicile</div>
                          <div><strong>fg-e</strong> - Forfait général extérieur</div>
                          <div className="pt-1 border-t border-gray-200">
                            <strong>Scores normaux :</strong> format "X-Y" (ex: 10-6)
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
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
                <TabsTrigger value="results" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Résultats
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

              <TabsContent value="results" className="space-y-4">
                {serieSelectionneeData && (
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                        {serieSelectionneeData.nom} - Semaine{' '}
                        {semaineSelectionnee}
                      </CardTitle>
                      <p className="text-center text-sm text-gray-600">
                        Encodage des résultats de tous les matchs de la série +
                        compositions et scores individuels pour CTT Frameries
                      </p>
                    </CardHeader>
                    <CardContent>
                      {matchsSemaine.length > 0 ? (
                        <div className="space-y-6">
                          {matchsSemaine.map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              membres={membres}
                              onUpdateMatch={updateMatch}
                              showIndividualScores
                              scoreInputRef={(el) => (scoreRefs.current[match.id] = el)}
                              onKeyDown={(e) => handleKeyDown(e, match.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Aucun match programmé</p>
                          <p className="text-sm">pour cette sélection</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
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
                  Choisissez une série pour commencer l'encodage des résultats
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
