/* eslint-disable prettier/prettier,no-console */

import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, PlusCircle, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { fetchSaisons, updateSaisonResults } from '@/services/api';
import { Joueur, Match, Saison } from '@/services/type.ts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UpdateResults() {
  const [allSaisons, setAllSaisons] = useState<Saison[]>([]);
  const [saison, setSaison] = useState<Saison | null>(null);
  const [serieSelectionnee, setSerieSelectionnee] = useState<string>('');
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [nouveauJoueurNom, setNouveauJoueurNom] = useState<string>('');

  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      setIsLoading(true);
      const data = await fetchSaisons();
      setAllSaisons(data);
      const saisonEnCours = data.find(
        (s: { statut: string }) => s.statut === 'En cours'
      );

      if (saisonEnCours) {
        // S'assurer que les joueurs sont initialisés pour tous les matchs
        const saisonMiseAJour = {
          ...saisonEnCours,
          calendrier: saisonEnCours.calendrier.map(match => ({
            ...match,
            joueursDomicile: match.joueursDomicile || [],
            joueursExterieur: match.joueursExterieur || []
          }))
        };
        setSaison(JSON.parse(JSON.stringify(saisonMiseAJour)));
        setIsSelecting(false);
      } else {
        setIsSelecting(true); // Aucune saison en cours, on doit en choisir une
      }
      setIsLoading(false);
    };
    chargerDonneesInitiales();
  }, []);

  const handleSelectSaison = (id: string) => {
    const saisonTrouvee = allSaisons.find((s) => s.id === id);
    if (saisonTrouvee) {
      // S'assurer que les joueurs sont initialisés pour tous les matchs
      const saisonMiseAJour = {
        ...saisonTrouvee,
        calendrier: saisonTrouvee.calendrier.map(match => ({
          ...match,
          joueursDomicile: match.joueursDomicile || [],
          joueursExterieur: match.joueursExterieur || []
        }))
      };
      setSaison(JSON.parse(JSON.stringify(saisonMiseAJour)));
      setSerieSelectionnee('');
      setSemaineSelectionnee(1);
      setIsSelecting(false);
    }
  };

  const mettreAJourScoreMatch = (matchId: string, score: string) => {
    if (!saison) return;
    setSaison({
      ...saison,
      calendrier: saison.calendrier.map((match) =>
        match.id === matchId ? { ...match, score } : match
      ),
    });
  };

  const estEquipeDeFrameries = (nomEquipe: string) => nomEquipe.includes('CTT Frameries');

  const ajouterJoueur = (matchId: string, estDomicile: boolean) => {
    if (!saison || !nouveauJoueurNom.trim()) return;

    setSaison({
      ...saison,
      calendrier: saison.calendrier.map((match) => {
        if (match.id === matchId) {
          const newJoueur = { id: uuidv4(), nom: nouveauJoueurNom };

          if (estDomicile) {
            return {
              ...match,
              joueursDomicile: [...(match.joueursDomicile || []), newJoueur]
            };
          } 
          return {
            ...match,
            joueursExterieur: [...(match.joueursExterieur || []), newJoueur]
          };
          
        }
        return match;
      })
    });

    setNouveauJoueurNom('');
  };

  const supprimerJoueur = (matchId: string, joueurId: string, estDomicile: boolean) => {
    if (!saison) return;

    setSaison({
      ...saison,
      calendrier: saison.calendrier.map((match) => {
        if (match.id === matchId) {
          if (estDomicile) {
            return {
              ...match,
              joueursDomicile: (match.joueursDomicile || []).filter(j => j.id !== joueurId)
            };
          } 
          return {
            ...match,
            joueursExterieur: (match.joueursExterieur || []).filter(j => j.id !== joueurId)
          };
          
        }
        return match;
      })
    });
  };

  const enregistrerResultats = async () => {
    if (!saison) return;
    try {
      // On récupère seulement les matchs modifiés avec leurs scores et joueurs
      const matchsAvecScores = saison.calendrier.filter(
        m => m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
      );

      await updateSaisonResults(saison.id, matchsAvecScores);
      setMessage('Résultats et joueurs enregistrés avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setMessage("Erreur lors de l'enregistrement");
    }
  };

  // Rendu de la liste des joueurs pour une équipe donnée
  const renderJoueursList = (match: Match, estDomicile: boolean) => {
    const joueurs = estDomicile ? match.joueursDomicile : match.joueursExterieur;
    const equipe = estDomicile ? match.domicile : match.exterieur;
    const estFrameries = estEquipeDeFrameries(equipe);

    if (!estFrameries) return null;

    return (
      <div className="mt-2 border-t pt-2">
        <p className="text-sm font-medium mb-2">Joueurs {equipe}</p>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Nom du joueur"
              value={nouveauJoueurNom}
              onChange={(e) => setNouveauJoueurNom(e.target.value)}
              className="flex-grow"
            />
            <Button
              size="sm"
              onClick={() => ajouterJoueur(match.id, estDomicile)}
            >
              <PlusCircle className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>

          <div className="space-y-1">
            {joueurs && joueurs.length > 0 ? (
              joueurs.map((joueur) => (
                <div key={joueur.id} className="flex items-center justify-between bg-gray-50 py-1 px-2 rounded">
                  <span>{joueur.nom}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => supprimerJoueur(match.id, joueur.id, estDomicile)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm italic">Aucun joueur encodé</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Chargement des données...</span>
      </div>
    );
  }

  if (isSelecting || !saison) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Mise à jour des résultats</h2>
        <p className="text-muted-foreground">
          Aucune saison n&#39;est actuellement &#34;En cours&#34;. Veuillez
          sélectionner une saison à modifier.
        </p>
        <div className="max-w-md">
          <Label>Sélectionnez une saison</Label>
          <Select onValueChange={handleSelectSaison}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une saison" />
            </SelectTrigger>
            <SelectContent>
              {allSaisons.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label} ({s.statut})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  const semaines = Array.from({ length: 22 }, (_, i) => i + 1);

  const matchsSemaine = saison.calendrier.filter(
    (m) => m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Résultats: {saison.label}{' '}
          <span className="text-sm font-medium text-primary">
            ({saison.statut})
          </span>
        </h2>
        <Button variant="outline" onClick={() => setIsSelecting(true)}>
          Changer de saison
        </Button>
      </div>

      {message && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Succès</AlertTitle>
          <AlertDescription className="text-green-700">
            {message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Série</Label>
          <Select
            value={serieSelectionnee}
            onValueChange={setSerieSelectionnee}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir une série" />
            </SelectTrigger>
            <SelectContent>
              {saison.series.map((serie) => (
                <SelectItem key={serie.id} value={serie.id}>
                  {serie.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Semaine</Label>
          <Select
            value={semaineSelectionnee.toString()}
            onValueChange={(v) =>
              setSemaineSelectionnee(Number.parseInt(v, 10))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir une semaine" />
            </SelectTrigger>
            <SelectContent>
              {semaines.map((s) => (
                <SelectItem key={s} value={s.toString()}>
                  Semaine {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {serieSelectionnee && (
        <div className="border p-4 rounded-lg">
          <h3 className="font-medium mb-4">
            Matchs de la semaine {semaineSelectionnee}
          </h3>

          {matchsSemaine.length > 0 ? (
            <div className="space-y-6">
              {matchsSemaine.map((match) => (
                <div key={match.id} className="border-b pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                  <div className="grid grid-cols-3 items-center gap-2 text-center mb-4">
                    <span className="text-right font-medium">
                      {match.domicile}
                    </span>
                    <Input
                      value={match.score}
                      onChange={(e) =>
                        mettreAJourScoreMatch(match.id, e.target.value)
                      }
                      placeholder="0-0"
                      className="max-w-24 mx-auto text-center"
                    />
                    <span className="text-left font-medium">
                      {match.exterieur}
                    </span>
                  </div>

                  <Tabs defaultValue="domicile" className="mt-4">
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="domicile">
                        {estEquipeDeFrameries(match.domicile) ? `Joueurs ${  match.domicile}` : match.domicile}
                      </TabsTrigger>
                      <TabsTrigger value="exterieur">
                        {estEquipeDeFrameries(match.exterieur) ? `Joueurs ${  match.exterieur}` : match.exterieur}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="domicile" className="py-2">
                      {estEquipeDeFrameries(match.domicile) ? (
                        renderJoueursList(match, true)
                      ) : (
                        <p className="text-center text-sm text-gray-500">L'encodage des joueurs n'est disponible que pour les équipes de CTT Frameries</p>
                      )}
                    </TabsContent>

                    <TabsContent value="exterieur" className="py-2">
                      {estEquipeDeFrameries(match.exterieur) ? (
                        renderJoueursList(match, false)
                      ) : (
                        <p className="text-center text-sm text-gray-500">L'encodage des joueurs n'est disponible que pour les équipes de CTT Frameries</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              ))}

              <Button onClick={enregistrerResultats} className="mt-6">
                Enregistrer les résultats et joueurs
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 italic mt-4 text-center">
              Aucun match programmé pour cette sélection.
            </p>
          )}
        </div>
      )}
    </div>
  );
}