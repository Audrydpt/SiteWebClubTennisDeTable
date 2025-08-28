/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Edit, Save, X } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { CommandeItem } from '@/services/type.ts';

interface EditItemModalProps {
  item: CommandeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: CommandeItem) => void;
  isLoading?: boolean;
}

const fournisseurs = [
  'Dandoy',
  'Butterfly',
  'Shop-ping',
  'Mister Ping',
];

export function EditItemModal({
  item,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: EditItemModalProps) {
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [quantity, setQuantity] = useState('');
  const [epaisseur, setEpaisseur] = useState('');
  const [couleur, setCouleur] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    if (item) {
      setNom(item.name);
      setPrix(item.price);
      setQuantity(item.quantity);
      setEpaisseur(item.epaisseur || '');
      setCouleur(item.couleur || '');
      setFournisseur(item.fournisseur || '');
      setType(item.type || '');
      setDescription(item.description || '');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!item || !nom.trim() || !prix || !quantity || !fournisseur) {
      setShowErrorDialog(true);
      return;
    }

    const updatedItem: CommandeItem = {
      ...item,
      name: nom.trim(),
      price: prix,
      quantity,
      epaisseur: item.category === 'mousse' ? epaisseur : undefined,
      couleur: item.category === 'mousse' ? couleur : undefined,
      type: item.category === 'bois' ? type : undefined,
      description: item.category === 'autre' ? description : undefined,
      fournisseur,
    };

    onSave(updatedItem);
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setNom('');
    setPrix('');
    setQuantity('');
    setEpaisseur('');
    setCouleur('');
    setFournisseur('');
    setType('');
    setDescription('');
  };

  if (!item) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Modifier l'article
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantité <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                  required
                />
              </div>
            </div>

            {item.category === 'mousse' && (
              <div className="grid grid-cols-2 gap-4">
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

            {item.category === 'bois' && (
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

            {item.category === 'autre' && (
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

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#F1C40F] hover:bg-[#F1C40F]/90 text-[#3A3A3A]"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-red-600">Champs manquants</DialogTitle>
            <DialogDescription>
              Veuillez remplir tous les champs obligatoires (nom, prix, fournisseur, quantité)
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowErrorDialog(false)}
              className="w-full"
              variant="outline"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
