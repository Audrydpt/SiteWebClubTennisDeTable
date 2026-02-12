import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClientCreateFormProps {
  onSubmit: (data: { nom: string; prenom: string; telephone?: string }) => void;
  loading?: boolean;
}

export default function ClientCreateForm({
  onSubmit,
  loading,
}: ClientCreateFormProps) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) return;
    onSubmit({
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: telephone.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-gray-400 text-sm font-medium">
        Nouveau client externe
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Prenom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          className="h-11 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl"
        />
        <Input
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="h-11 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl"
        />
      </div>
      <Input
        placeholder="Telephone (optionnel)"
        value={telephone}
        onChange={(e) => setTelephone(e.target.value)}
        className="h-11 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl"
      />
      <Button
        type="submit"
        disabled={!nom.trim() || !prenom.trim() || loading}
        className="w-full h-11 bg-green-600 text-white hover:bg-green-700 rounded-xl disabled:opacity-30"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {loading ? 'Creation...' : 'Creer le client'}
      </Button>
    </form>
  );
}
