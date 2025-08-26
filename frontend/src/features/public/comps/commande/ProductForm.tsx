/* eslint-disable */
import type React from 'react';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductFormProps {
  category: 'mousse' | 'bois' | 'autre';
  onAdd: (product: any) => void;
}

const fournisseurs = [
  'Butterfly',
  'Yasaka',
  'Stiga',
  'Donic',
  'Tibhar',
  'Joola',
  'Andro',
  'Xiom',
  'Cornilleau',
  'Autre',
];

export function ProductForm({ category, onAdd }: ProductFormProps) {
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [epaisseur, setEpaisseur] = useState('');
  const [couleur, setCouleur] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim() || !prix || !fournisseur) {
      alert(
        'Veuillez remplir tous les champs obligatoires (nom, prix, fournisseur)'
      );
      return;
    }

    const baseProduct = {
      nom: nom.trim(),
      prix: Number.parseFloat(prix),
      marque: fournisseur,
    };

    let product;
    if (category === 'mousse') {
      product = {
        ...baseProduct,
        epaisseur: epaisseur || '2.1mm',
        couleur: couleur || 'Rouge',
      };
    } else if (category === 'bois') {
      product = {
        ...baseProduct,
        type: type || 'Concave',
      };
    } else {
      product = {
        ...baseProduct,
        description: description || '',
      };
    }

    onAdd(product);

    // Reset form
    setNom('');
    setPrix('');
    setFournisseur('');
    setEpaisseur('');
    setCouleur('');
    setType('');
    setDescription('');
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'mousse':
        return 'Ajouter une mousse';
      case 'bois':
        return 'Ajouter un bois';
      case 'autre':
        return 'Ajouter un accessoire';
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="bg-[#F1C40F] p-3 rounded-full">
            <Plus className="w-5 h-5 text-[#3A3A3A]" />
          </div>
          {getCategoryTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom" className="text-sm font-medium">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom du produit"
                required
              />
            </div>

            <div>
              <Label htmlFor="prix" className="text-sm font-medium">
                Prix (€) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prix"
                type="number"
                step="0.01"
                min="0"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="fournisseur" className="text-sm font-medium">
              Fournisseur <span className="text-red-500">*</span>
            </Label>
            <Select value={fournisseur} onValueChange={setFournisseur} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {fournisseurs.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category === 'mousse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="epaisseur" className="text-sm font-medium">
                  Épaisseur
                </Label>
                <Input
                  id="epaisseur"
                  value={epaisseur}
                  onChange={(e) => setEpaisseur(e.target.value)}
                  placeholder="2.1mm"
                />
              </div>
              <div>
                <Label htmlFor="couleur" className="text-sm font-medium">
                  Couleur
                </Label>
                <Input
                  id="couleur"
                  value={couleur}
                  onChange={(e) => setCouleur(e.target.value)}
                  placeholder="Rouge"
                />
              </div>
            </div>
          )}

          {category === 'bois' && (
            <div>
              <Label htmlFor="type" className="text-sm font-medium">
                Type de manche
              </Label>
              <Input
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Concave"
              />
            </div>
          )}

          {category === 'autre' && (
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du produit"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#F1C40F] hover:bg-[#F1C40F]/90 text-[#3A3A3A] font-medium"
          >
            <div className="bg-white p-1 rounded-full mr-2">
              <Plus className="w-4 h-4 text-[#3A3A3A]" />
            </div>
            Ajouter à la commande
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
