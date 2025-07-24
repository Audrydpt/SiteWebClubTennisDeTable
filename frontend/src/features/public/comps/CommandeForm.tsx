/* eslint-disable */
import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { SelectMembre } from '@/features/public/comps/commande/membres.tsx';
import { FormMousses } from '@/features/public/comps/commande/mousse.tsx';
import { FormBois } from '@/features/public/comps/commande/bois.tsx';
import { FormAutre } from '@/features/public/comps/commande/autre.tsx';
import { Mousse, Bois, Autre, Membre } from '@/services/type.ts';
import {
  createSelection,
  fetchUsers,
  fetchSelectionByMembre,
  updateSelection,
} from '@/services/api.ts';

export default function CommandePage() {
  const [membreSelectionne, setMembreSelectionne] = useState<string | null>(
    null
  );
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [mousses, setMousses] = useState<Mousse[]>([]);
  const [bois, setBois] = useState<Bois[]>([]);
  const [autres, setAutres] = useState<Autre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoadingMembres, setIsLoadingMembres] = useState(true);

  useEffect(() => {
    const chargerMembres = async () => {
      try {
        const donneesMembers = await fetchUsers();
        setMembres(donneesMembers);
      } catch (error) {
        console.error('Erreur lors du chargement des membres:', error);
        alert('Impossible de charger la liste des membres.');
      } finally {
        setIsLoadingMembres(false);
      }
    };

    chargerMembres();
  }, []);

  const handleSelectMembre = async (membreNom: string) => {
    setIsLoading(true);
    try {
      const existingSelection = await fetchSelectionByMembre(membreNom);
      if (existingSelection) {
        setSelectionId(existingSelection.id);
        setMousses(existingSelection.mousses || []);
        setBois(existingSelection.bois || []);
        setAutres(existingSelection.autres || []);
      } else {
        setSelectionId(null);
        setMousses([]);
        setBois([]);
        setAutres([]);
      }
      setMembreSelectionne(membreNom);
    } catch (error) {
      console.error('Erreur lors de la récupération de la sélection:', error);
      alert(
        'Impossible de charger les données existantes. Une nouvelle sélection sera créée.'
      );
      setMembreSelectionne(membreNom);
      setSelectionId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMousse = (nouvelleMousse: Mousse) =>
    setMousses([...mousses, nouvelleMousse]);
  const handleAddBois = (nouveauBois: Bois) => setBois([...bois, nouveauBois]);
  const handleAddAutre = (nouvelAutre: Autre) =>
    setAutres([...autres, nouvelAutre]);
  const handleRemoveMousse = (index: number) =>
    setMousses(mousses.filter((_, i) => i !== index));
  const handleRemoveBois = (index: number) =>
    setBois(bois.filter((_, i) => i !== index));
  const handleRemoveAutre = (index: number) =>
    setAutres(autres.filter((_, i) => i !== index));

  const calculerTotal = () => {
    const totalMousses = mousses.reduce(
      (acc, item) => acc + (item.prix || 0),
      0
    );
    const totalBois = bois.reduce((acc, item) => acc + (item.prix || 0), 0);
    const totalAutres = autres.reduce((acc, item) => acc + (item.prix || 0), 0);
    return totalMousses + totalBois + totalAutres;
  };

  const handleSaveSelection = async () => {
    if (!membreSelectionne) return;
    setIsLoading(true);

    const selectionData = {
      membre: membreSelectionne,
      mousses,
      bois,
      autres,
      totalEstime: calculerTotal(),
      dateEnregistrement: new Date().toISOString(),
    };

    try {
      if (selectionId) {
        const updated = await updateSelection(selectionId, selectionData);
        console.log('Sélection mise à jour :', updated);
        alert('Votre sélection a été mise à jour !');
      } else {
        const created = await createSelection(selectionData);
        setSelectionId(created.id);
        console.log('Sélection enregistrée :', created);
        alert('Votre sélection a bien été enregistrée !');
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingMembres) {
    return (
      <div className="flex items-center justify-center p-10 min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading && !membreSelectionne) {
    return (
      <div className="flex items-center justify-center p-10 min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!membreSelectionne) {
    return <SelectMembre membres={membres} onSelect={handleSelectMembre} />;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Enregistrement de matériel</CardTitle>
          <CardDescription>
            Sélection pour :{' '}
            <span className="font-semibold text-primary">
              {membreSelectionne}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="mousses" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mousses">Mousses</TabsTrigger>
              <TabsTrigger value="bois">Bois</TabsTrigger>
              <TabsTrigger value="autre">Autre</TabsTrigger>
            </TabsList>
            <TabsContent value="mousses">
              <FormMousses
                mousses={mousses}
                onAddMousse={handleAddMousse}
                onRemoveMousse={handleRemoveMousse}
              />
            </TabsContent>
            <TabsContent value="bois">
              <FormBois
                bois={bois}
                onAddBois={handleAddBois}
                onRemoveBois={handleRemoveBois}
              />
            </TabsContent>
            <TabsContent value="autre">
              <FormAutre
                autres={autres}
                onAddAutre={handleAddAutre}
                onRemoveAutre={handleRemoveAutre}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">
              Récapitulatif de la sélection
            </h3>
            {mousses.length === 0 &&
            bois.length === 0 &&
            autres.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun article dans la sélection.
              </p>
            ) : (
              <ul className="text-sm text-muted-foreground space-y-1">
                {mousses.map((m, i) => (
                  <li
                    key={`mousse-recap-${i}`}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {`${m.marque} ${m.nom} (${m.epaisseur}, ${m.couleur})`}
                      {m.prix && (
                        <span className="font-semibold">
                          {' '}
                          - {m.prix.toFixed(2)} €
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveMousse(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {bois.map((b, i) => (
                  <li
                    key={`bois-recap-${i}`}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {`${b.marque} ${b.nom} (${b.type})`}
                      {b.prix && (
                        <span className="font-semibold">
                          {' '}
                          - {b.prix.toFixed(2)} €
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveBois(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {autres.map((a, i) => (
                  <li
                    key={`autre-recap-${i}`}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {a.nom}
                      {a.prix && (
                        <span className="font-semibold">
                          {' '}
                          - {a.prix.toFixed(2)} €
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveAutre(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t pt-4 flex justify-end items-center text-lg font-bold">
              Total estimé : {calculerTotal().toFixed(2)} €
          </div>
          <Button
            onClick={handleSaveSelection}
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer la sélection'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}