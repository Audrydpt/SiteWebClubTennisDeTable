/* eslint-disable */
import { useState, useMemo, useEffect } from 'react';
import { Search, Users, UserPlus, Gift } from 'lucide-react';
import type { Member, ClientCaisse, CompteEquipe } from '@/services/type';
import { Input } from '@/components/ui/input';
import { fetchComptesEquipe } from '@/services/api';

interface ClientResult {
  type: 'membre' | 'externe' | 'club';
  id: string;
  nom: string;
  prenom?: string;
  detail?: string;
}

interface ClientSearchBarProps {
  membres: Member[];
  clientsExternes: ClientCaisse[];
  onSelect: (client: {
    type: 'membre' | 'externe' | 'club';
    id: string;
    nom: string;
  }) => void;
}

export default function ClientSearchBar({
  membres,
  clientsExternes,
  onSelect,
}: ClientSearchBarProps) {
  const [search, setSearch] = useState('');
  const [equipes, setEquipes] = useState<CompteEquipe[]>([]);

  useEffect(() => {
    // Charger les équipes au montage
    fetchComptesEquipe().then(setEquipes).catch(console.error);
  }, []);

  const results = useMemo(() => {
    if (search.length < 2) return [];
    const term = search.toLowerCase();
    const list: ClientResult[] = [];

    // Recherche dans les équipes
    equipes.forEach((e) => {
      const equipeNom = e.nom.toLowerCase();
      const equipeLabel = e.equipeLabel?.toLowerCase() || '';
      if (equipeNom.includes(term) || equipeLabel.includes(term)) {
        list.push({
          type: 'club',
          id: e.id,
          nom: e.nom,
          detail: e.equipeLabel ? `Équipe ${e.equipeLabel}` : 'Club',
        });
      }
    });

    // Recherche dans les membres
    membres.forEach((m) => {
      const fullName = `${m.prenom} ${m.nom}`.toLowerCase();
      if (fullName.includes(term)) {
        list.push({
          type: 'membre',
          id: m.id,
          nom: m.nom,
          prenom: m.prenom,
          detail: m.classement || undefined,
        });
      }
    });

    // Recherche dans les clients externes
    clientsExternes.forEach((c) => {
      const fullName = `${c.prenom} ${c.nom}`.toLowerCase();
      if (fullName.includes(term)) {
        list.push({
          type: 'externe',
          id: c.id,
          nom: c.nom,
          prenom: c.prenom,
          detail: c.telephone || undefined,
        });
      }
    });

    return list.slice(0, 10);
  }, [search, membres, clientsExternes, equipes]);

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-10 text-base bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl"
          autoFocus
        />
      </div>

      {results.length > 0 && (
        <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() =>
                onSelect({
                  type: r.type,
                  id: r.id,
                  nom: r.type === 'club' ? r.nom : `${r.prenom} ${r.nom}`,
                })
              }
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#4A4A4A] hover:bg-[#555] transition-colors text-left"
            >
              {r.type === 'membre' ? (
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
              ) : r.type === 'externe' ? (
                <UserPlus className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {r.type === 'club' ? r.nom : `${r.prenom} ${r.nom}`}
                </p>
                {r.detail && (
                  <p className="text-gray-400 text-xs">{r.detail}</p>
                )}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.type === 'membre'
                    ? 'bg-blue-500/20 text-blue-400'
                    : r.type === 'externe'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {r.type === 'membre' ? 'Membre' : r.type === 'externe' ? 'Externe' : 'Équipe'}
              </span>
            </button>
          ))}
        </div>
      )}

      {search.length >= 2 && results.length === 0 && (
        <p className="mt-3 text-gray-500 text-sm text-center">
          Aucun client trouve
        </p>
      )}
    </div>
  );
}
