/* eslint-disable @typescript-eslint/no-explicit-any,prettier/prettier */

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, PlusCircle, Save } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchSaisons, updateSaison } from '@/services/api';
import { Saison } from '@/services/type.ts';

export default function UpdateSaison() {
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [saisonSelectionneeId, setSaisonSelectionneeId] = useState<string>('');
  const [saison, setSaison] = useState<Saison | null>(null);
  const [nouvelleEquipeClub, setNouvelleEquipeClub] = useState('');
  const [nouvelleSerie, setNouvelleSerie] = useState('');
  const [nouvelleEquipeAdverse, setNouvelleEquipeAdverse] = useState('');

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
    }
  };

  const handleSelectSaison = (id: string) => {
    setSaisonSelectionneeId(id);
    chargerSaison(id);
  };

  const handleUpdate = (champ: keyof Saison, valeur: any) => {
    if (!saison) return;
    setSaison({ ...saison, [champ]: valeur });
  };

  const soumettreFormulaire = async () => {
    if (!saison) return;
    try {
      await updateSaison(saison.id, saison);
      alert('Saison mise à jour avec succès !');
      // Optionnel: recharger les données
      const data = await fetchSaisons();
      setSaisons(data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (!saisonSelectionneeId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Modifier une saison</h2>
        <div className="max-w-md">
          <Label>Sélectionnez une saison à modifier</Label>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Modifier la saison: {saison.label}
        </h2>
        <div>
          <Button
            variant="outline"
            onClick={() => setSaisonSelectionneeId('')}
            className="mr-2"
          >
            Changer de saison
          </Button>
          <Button onClick={soumettreFormulaire}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="saisonNom">Nom de la saison</Label>
            <Input
              id="saisonNom"
              value={saison.label}
              onChange={(e) => handleUpdate('label', e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Équipes du Club</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={nouvelleEquipeClub}
                onChange={(e) => setNouvelleEquipeClub(e.target.value)}
                placeholder="Nom équipe club"
              />
              <Button
                onClick={() => {
                  if (nouvelleEquipeClub.trim() === '') return;
                  handleUpdate('equipesClub', [
                    ...saison.equipesClub,
                    { id: uuidv4(), nom: nouvelleEquipeClub, serieId: '' },
                  ]);
                  setNouvelleEquipeClub('');
                }}
              >
                Ajouter
              </Button>
            </div>
            <ul className="space-y-2">
              {saison.equipesClub.map((e) => (
                <li
                  key={e.id}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded"
                >
                  {e.nom}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleUpdate(
                        'equipesClub',
                        saison.equipesClub.filter((eq) => eq.id !== e.id)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Séries et Équipes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={saison.series[0]?.id || 'new'}>
            <TabsList>
              {saison.series.map((s) => (
                <TabsTrigger key={s.id} value={s.id}>
                  {s.nom}
                </TabsTrigger>
              ))}
              <TabsTrigger value="new-serie">
                <PlusCircle className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
            {saison.series.map((serie) => (
              <TabsContent
                key={serie.id}
                value={serie.id}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{serie.nom}</h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleUpdate(
                        'series',
                        saison.series.filter((s) => s.id !== serie.id)
                      )
                    }
                  >
                    Supprimer la série
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={nouvelleEquipeAdverse}
                    onChange={(e) => setNouvelleEquipeAdverse(e.target.value)}
                    placeholder="Nom équipe adverse"
                  />
                  <Button
                    onClick={() => {
                      if (nouvelleEquipeAdverse.trim() === '') return;
                      const seriesUpdated = saison.series.map((s) =>
                        s.id === serie.id
                          ? {
                            ...s,
                            equipes: [
                              ...s.equipes,
                              {
                                id: uuidv4(),
                                nom: nouvelleEquipeAdverse,
                                serieId: serie.id,
                              },
                            ],
                          }
                          : s
                      );
                      handleUpdate('series', seriesUpdated);
                      setNouvelleEquipeAdverse('');
                    }}
                  >
                    Ajouter Équipe
                  </Button>
                </div>
                <ul className="space-y-2">
                  {serie.equipes.map((e) => (
                    <li
                      key={e.id}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded"
                    >
                      {e.nom}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const seriesUpdated = saison.series.map((s) =>
                            s.id === serie.id
                              ? {
                                ...s,
                                equipes: s.equipes.filter(
                                  (eq) => eq.id !== e.id
                                ),
                              }
                              : s
                          );
                          handleUpdate('series', seriesUpdated);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            ))}
            <TabsContent value="new-serie" className="space-y-4 pt-4">
              <h3 className="font-semibold">Ajouter une nouvelle série</h3>
              <div className="flex gap-2">
                <Input
                  value={nouvelleSerie}
                  onChange={(e) => setNouvelleSerie(e.target.value)}
                  placeholder="Nom de la nouvelle série"
                />
                <Button
                  onClick={() => {
                    if (nouvelleSerie.trim() === '') return;
                    handleUpdate('series', [
                      ...saison.series,
                      { id: uuidv4(), nom: nouvelleSerie, equipes: [] },
                    ]);
                    setNouvelleSerie('');
                  }}
                >
                  Créer Série
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
