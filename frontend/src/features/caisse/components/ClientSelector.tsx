/* eslint-disable */

import { useState } from 'react';
import type { Member, ClientCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import ClientSearchBar from './ClientSearchBar';
import ClientCreateForm from './ClientCreateForm';
import { createClientCaisse } from '@/services/api';

interface ClientSelectorProps {
  membres: Member[];
  clientsExternes: ClientCaisse[];
  onSelect: (client: { type: 'membre' | 'externe'; id: string; nom: string }) => void;
  onClose: () => void;
  onClientCreated: (client: ClientCaisse) => void;
}

export default function ClientSelector({
  membres,
  clientsExternes,
  onSelect,
  onClose,
  onClientCreated,
}: ClientSelectorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateClient = async (data: {
    nom: string;
    prenom: string;
    telephone?: string;
  }) => {
    setCreating(true);
    try {
      const newClient = await createClientCaisse(data);
      onClientCreated(newClient);
      onSelect({
        type: 'externe',
        id: newClient.id,
        nom: `${newClient.prenom} ${newClient.nom}`,
      });
    } catch (err) {
      console.error('Erreur creation client:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Selectionner un client</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ClientSearchBar
          membres={membres}
          clientsExternes={clientsExternes}
          onSelect={(client) => {
            onSelect(client);
            onClose();
          }}
        />

        <div className="my-4 border-t border-[#4A4A4A]" />

        {showCreateForm ? (
          <ClientCreateForm onSubmit={handleCreateClient} loading={creating} />
        ) : (
          <Button
            variant="ghost"
            onClick={() => setShowCreateForm(true)}
            className="w-full h-11 bg-[#4A4A4A] text-gray-300 hover:bg-[#555] hover:text-white rounded-xl"
          >
            Creer un nouveau client externe
          </Button>
        )}
      </div>
    </div>
  );
}
