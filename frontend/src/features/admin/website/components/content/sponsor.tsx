/* eslint-disable @typescript-eslint/no-unused-vars,no-restricted-globals,no-alert,@typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  fetchImages,
} from '@/services/api';
import { SponsorData, Image } from '@/services/type';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function SponsorsManager() {
  const [sponsors, setSponsors] = useState<SponsorData[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSponsor, setCurrentSponsor] = useState<Partial<SponsorData>>(
    {}
  );
  const [isEditing, setIsEditing] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sponsorsData, imagesData] = await Promise.all([
        fetchSponsors(),
        fetchImages(),
      ]);
      setSponsors(
        sponsorsData.sort(
          (a: { order: number }, b: { order: number }) => a.order - b.order
        )
      );
      setImages(imagesData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (sponsor?: SponsorData) => {
    if (sponsor) {
      setCurrentSponsor({ ...sponsor });
      setIsEditing(true);
    } else {
      setCurrentSponsor({
        name: '',
        texte: '',
        description: '',
        email: '',
        telephone: '',
        adresse: '',
        logoUrl: '',
        redirectUrl: '',
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
        order: sponsors.length + 1,
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentSponsor({});
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setCurrentSponsor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await updateSponsor(currentSponsor.id as string, currentSponsor);
        toast.success('Sponsor mis à jour avec succès');
      } else {
        await createSponsor(currentSponsor);
        toast.success('Sponsor créé avec succès');
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      toast.error(
        `Erreur lors de ${isEditing ? 'la modification' : 'la création'} du sponsor`
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce sponsor ?')) {
      try {
        await deleteSponsor(id);
        toast.success('Sponsor supprimé avec succès');
        loadData();
      } catch (error) {
        toast.error('Erreur lors de la suppression du sponsor');
      }
    }
  };

  const handleChangeOrder = async (
    sponsor: SponsorData,
    direction: 'up' | 'down'
  ) => {
    try {
      const sortedSponsors = [...sponsors].sort((a, b) => a.order - b.order);
      const currentIndex = sortedSponsors.findIndex((s) => s.id === sponsor.id);

      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === sortedSponsors.length - 1)
      ) {
        return;
      }

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const targetSponsor = sortedSponsors[targetIndex];

      await updateSponsor(sponsor.id, {
        ...sponsor,
        order: targetSponsor.order,
      });
      await updateSponsor(targetSponsor.id, {
        ...targetSponsor,
        order: sponsor.order,
      });

      toast.success('Ordre mis à jour');
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la modification de l'ordre");
    }
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des sponsors</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un sponsor
        </Button>
      </div>

      <div className="grid gap-4">
        {sponsors.map((sponsor) => (
          <div
            key={sponsor.id}
            className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-md flex-shrink-0">
                <img
                  src={sponsor.logoUrl || '/placeholder.svg'}
                  alt={sponsor.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div>
                <h3 className="font-medium text-lg">{sponsor.name}</h3>
                <p className="text-sm text-gray-500">{sponsor.texte}</p>
                <p className="text-xs text-gray-400">Ordre: {sponsor.order}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleChangeOrder(sponsor, 'up')}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleChangeOrder(sponsor, 'down')}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleOpenDialog(sponsor)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="text-red-500"
                onClick={() => handleDelete(sponsor.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Modifier un sponsor' : 'Ajouter un sponsor'}
            </DialogTitle>
          </DialogHeader>

          {/* Formulaire en grille responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                name="name"
                value={currentSponsor.name || ''}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="texte">Mini descriptif (2-3 mots)</Label>
              <Input
                id="texte"
                name="texte"
                value={currentSponsor.texte || ''}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="description">Description (À propos)</Label>
              <Textarea
                id="description"
                name="description"
                value={currentSponsor.description || ''}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={currentSponsor.email || ''}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                name="telephone"
                value={currentSponsor.telephone || ''}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                name="adresse"
                value={currentSponsor.adresse || ''}
                onChange={handleChange}
              />
            </div>
            {['facebook', 'instagram', 'twitter', 'youtube', 'linkedin'].map(
              (field) => (
                <div className="grid gap-2" key={field}>
                  <Label htmlFor={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </Label>
                  <Input
                    id={field}
                    name={field}
                    value={(currentSponsor as any)[field] || ''}
                    onChange={handleChange}
                  />
                </div>
              )
            )}
            <div className="grid gap-2">
              <Label htmlFor="logoUrl">Logo</Label>
              <select
                id="logoUrl"
                name="logoUrl"
                value={currentSponsor.logoUrl || ''}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="">-- Choisir une image --</option>
                {images.map((img) => (
                  <option key={img.id} value={img.url}>
                    {img.label}
                  </option>
                ))}
              </select>
              {currentSponsor.logoUrl && (
                <div className="mt-2 h-20 w-20">
                  <img
                    src={currentSponsor.logoUrl}
                    alt="Aperçu du logo"
                    className="max-h-full max-w-full object-contain border rounded"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="redirectUrl">URL de redirection</Label>
              <Input
                id="redirectUrl"
                name="redirectUrl"
                value={currentSponsor.redirectUrl || ''}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">Ordre</Label>
              <Input
                id="order"
                name="order"
                type="number"
                value={currentSponsor.order || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
