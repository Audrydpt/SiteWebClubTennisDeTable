/* eslint-disable */
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Mousse } from '@/services/type.ts';

interface FormMoussesProps {
  mousses: Mousse[];
  onAddMousse: (mousse: Mousse) => void;
  onRemoveMousse: (index: number) => void;
}

export function FormMousses({
                              mousses,
                              onAddMousse,
                              onRemoveMousse,
                            }: FormMoussesProps) {
  const [marque, setMarque] = useState('');
  const [nom, setNom] = useState('');
  const [epaisseur, setEpaisseur] = useState('');
  const [type, setType] = useState('');
  const [couleur, setCouleur] = useState('');
  const [prix, setPrix] = useState('');

  const handleAjouter = () => {
    if (!marque || !nom || !epaisseur || !couleur || !prix) {
      alert('Veuillez remplir tous les champs obligatoires pour la mousse.');
      return;
    }
    const prixNum = Number.parseFloat(prix);
    if (isNaN(prixNum)) {
      alert('Le prix doit être un nombre valide.');
      return;
    }
    onAddMousse({ marque, nom, epaisseur, type: type || undefined, couleur, prix: prixNum });
    setMarque('');
    setNom('');
    setEpaisseur('');
    setType('');
    setCouleur('');
    setPrix('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter une Mousse</CardTitle>
        <CardDescription>
          Remplissez les détails de la mousse que vous souhaitez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mousse-marque">Marque</Label>
            <Input
              id="mousse-marque"
              value={marque}
              onChange={(e) => setMarque(e.target.value)}
              placeholder="Ex: Butterfly"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mousse-nom">Nom de l&#39;article</Label>
            <Input
              id="mousse-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Tenergy 05"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mousse-epaisseur">Épaisseur</Label>
            <Input
              id="mousse-epaisseur"
              value={epaisseur}
              onChange={(e) => setEpaisseur(e.target.value)}
              placeholder="Ex: 2.1mm, MAX..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mousse-couleur">Couleur</Label>
            <Input
              id="mousse-couleur"
              value={couleur}
              onChange={(e) => setCouleur(e.target.value)}
              placeholder="Ex: Rouge, Noir..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mousse-prix">Prix</Label>
            <Input
              id="mousse-prix"
              type="number"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="Ex: 45.90"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>
        <Button onClick={handleAjouter} className="w-full md:w-auto">
          Ajouter à la sélection
        </Button>

        {mousses.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium">Mousses ajoutées :</h4>
            <ul className="list-none mt-2 space-y-2">
              {mousses.map((m, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between p-2 rounded-md bg-muted"
                >
                  <span className="text-sm text-muted-foreground">
                    {`${m.marque} ${m.nom} - ${m.epaisseur}, ${m.couleur}`}
                    {m.type && ` (${m.type})`}
                    <span className="font-semibold">
                      {' '}
                      - {m.prix.toFixed(2)} €
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onRemoveMousse(i)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}