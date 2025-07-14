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
import { Bois } from '@/services/type.ts';

interface FormBoisProps {
  bois: Bois[];
  onAddBois: (bois: Bois) => void;
  onRemoveBois: (index: number) => void;
}

export function FormBois({ bois, onAddBois, onRemoveBois }: FormBoisProps) {
  const [marque, setMarque] = useState('');
  const [nom, setNom] = useState('');
  const [type, setType] = useState('');
  const [prix, setPrix] = useState('');

  const handleAjouter = () => {
    if (!marque || !nom || !type) {
      alert('Veuillez remplir tous les champs pour le bois.');
      return;
    }
    const prixNum = prix ? Number.parseFloat(prix) : undefined;
    onAddBois({ marque, nom, type, prix: prixNum });
    setMarque('');
    setNom('');
    setType('');
    setPrix('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un Bois</CardTitle>
        <CardDescription>
          Remplissez les détails du bois que vous souhaitez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bois-marque">Marque</Label>
            <Input
              id="bois-marque"
              value={marque}
              onChange={(e) => setMarque(e.target.value)}
              placeholder="Ex: Stiga"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bois-nom">Nom</Label>
            <Input
              id="bois-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Cybershape"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bois-type">Type de manche</Label>
            <Input
              id="bois-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Ex: Concave, Droit..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mousse-prix">Prix</Label>
            <Input
              id="mousse-prix"
              type="number"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="Ex: 40.00"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>
        <Button onClick={handleAjouter} className="w-full md:w-auto">
          Ajouter à la sélection
        </Button>

        {bois.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium">Bois ajoutés :</h4>
            <ul className="list-none mt-2 space-y-2">
              {bois.map((b, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between p-2 rounded-md bg-muted"
                >
                  <span className="text-sm text-muted-foreground">
                    {`${b.marque} ${b.nom} - ${b.type}`}
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
                    className="h-7 w-7"
                    onClick={() => onRemoveBois(i)}
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
