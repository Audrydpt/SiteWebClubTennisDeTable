/* eslint-disable */
'use client';

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
import { Textarea } from '@/components/ui/textarea.tsx';
import { Autre } from '@/services/type.ts';

interface FormAutreProps {
  autres: Autre[];
  onAddAutre: (autre: Autre) => void;
  onRemoveAutre: (index: number) => void;
}

export function FormAutre({
  autres,
  onAddAutre,
  onRemoveAutre,
}: FormAutreProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');

  const handleAjouter = () => {
    if (!nom) {
      alert("Veuillez indiquer le nom de l'article.");
      return;
    }
    const prixNum = prix ? Number.parseFloat(prix) : undefined;
    onAddAutre({ nom, description, prix: prixNum });
    setNom('');
    setDescription('');
    setPrix('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un autre article</CardTitle>
        <CardDescription>
          Pour tout autre type de matériel (colle, short, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="autre-nom">Nom de l&lsquo;article</Label>
          <Input
            id="autre-nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Colle, Housse de raquette..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="autre-description">Description (optionnel)</Label>
          <Textarea
            id="autre-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Précisez la taille, couleur, ou autre information utile."
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
        <Button onClick={handleAjouter} className="w-full md:w-auto">
          Ajouter à la sélection
        </Button>

        {autres.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium">Articles divers ajoutés :</h4>
            <ul className="list-none mt-2 space-y-2">
              {autres.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between p-2 rounded-md bg-muted"
                >
                  <span className="text-sm text-muted-foreground">
                    {a.nom}
                    {a.description ? ` (${a.description})` : ''}
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
                    className="h-7 w-7"
                    onClick={() => onRemoveAutre(i)}
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
