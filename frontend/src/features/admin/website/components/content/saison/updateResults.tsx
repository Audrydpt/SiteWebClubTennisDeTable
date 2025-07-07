/* eslint-disable prettier/prettier */

import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
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
import { fetchSaisons, updateSaison } from '@/services/api';
import { Saison } from '@/services/type.ts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UpdateResults() {
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [saisonSelectionneeId, setSaisonSelectionneeId] = useState<string>('');
  const [saison, setSaison] = useState<Saison | null>(null);
  const [serieSelectionnee, setSerieSelectionnee] = useState<string>('');
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<number>(1);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const chargerSaisons = async () => {
      const data = await fetchSaisons();
      setSaisons(data);
    };
    chargerSaisons();
  }, []);

  const chargerSaison = (id: string) => {
    const saisonTrouvee = saisons.find((s) => s.id === id);
    if (saisonTrouvee) {
      setSaison(JSON.parse(JSON.stringify(saisonTrouvee))); // Deep copy
      setSerieSelectionnee('');
      setSemaineSelectionnee(1);
    }
  };

  const handleSelectSaison = (id: string) => {
    setSaisonSelectionneeId(id);
    chargerSaison(id);
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
      await updateSaison(saison.id, saison);
      setMessage('Résultats enregistrés avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setMessage("Erreur lors de l'enregistrement");
    }
  };

  const semaines = Array.from({ length: 22 }, (_, i) => i + 1);

  if (!saisonSelectionneeId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Mise à jour des résultats</h2>
        <div className="max-w-md">
          <Label>Sélectionnez une saison</Label>
          <Select onValueChange={handleSelectSaison}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une saison" />
            </SelectTrigger>
            <SelectContent>
              {saisons.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (!saison) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        Mise à jour des résultats: {saison.label}
      </h2>

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
