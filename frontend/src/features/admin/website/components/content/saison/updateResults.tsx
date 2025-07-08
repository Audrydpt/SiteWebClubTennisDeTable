/* eslint-disable prettier/prettier,no-console */

import { useState, useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
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
import { Saison } from '@/services/type.ts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UpdateResults() {
  const [allSaisons, setAllSaisons] = useState<Saison[]>([]);
  const [saison, setSaison] = useState<Saison | null>(null);
  const [serieSelectionnee, setSerieSelectionnee] = useState<string>('');
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      setIsLoading(true);
      const data = await fetchSaisons();
      setAllSaisons(data);
      const saisonEnCours = data.find(
        (s: { statut: string }) => s.statut === 'En cours'
      );

      if (saisonEnCours) {
        setSaison(JSON.parse(JSON.stringify(saisonEnCours)));
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
      setSaison(JSON.parse(JSON.stringify(saisonTrouvee)));
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

  const enregistrerResultats = async () => {
    if (!saison) return;
    try {
      // On récupère seulement les matchs modifiés avec leurs scores
      const matchsAvecScores = saison.calendrier.filter(
        m => m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
      );

      await updateSaisonResults(saison.id, matchsAvecScores);
      setMessage('Résultats enregistrés avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setMessage("Erreur lors de l'enregistrement");
    }
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
          <div className="space-y-4">
            {saison.calendrier
              .filter(
                (m) =>
                  m.serieId === serieSelectionnee &&
                  m.semaine === semaineSelectionnee
              )
              .map((match) => (
                <div
                  key={match.id}
                  className="grid grid-cols-3 items-center gap-2 text-center"
                >
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
              ))}
          </div>
          {saison.calendrier.some(
            (m) =>
              m.serieId === serieSelectionnee &&
              m.semaine === semaineSelectionnee
          ) ? (
            <Button onClick={enregistrerResultats} className="mt-6">
              Enregistrer les résultats
            </Button>
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
