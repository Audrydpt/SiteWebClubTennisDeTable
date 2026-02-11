import { useState, useMemo } from 'react';
import type { Member, ClientCaisse } from '@/services/type';
import { Input } from '@/components/ui/input';
import { Search, Users, UserPlus } from 'lucide-react';

interface ClientResult {
  type: 'membre' | 'externe';
  id: string;
  nom: string;
  prenom: string;
  detail?: string;
}

interface ClientSearchBarProps {
  membres: Member[];
  clientsExternes: ClientCaisse[];
  onSelect: (client: { type: 'membre' | 'externe'; id: string; nom: string }) => void;
}

export default function ClientSearchBar({
  membres,
  clientsExternes,
  onSelect,
}: ClientSearchBarProps) {
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    if (search.length < 2) return [];
    const term = search.toLowerCase();
    const list: ClientResult[] = [];

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
  }, [search, membres, clientsExternes]);

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
                  nom: `${r.prenom} ${r.nom}`,
                })
              }
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#4A4A4A] hover:bg-[#555] transition-colors text-left"
            >
              {r.type === 'membre' ? (
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
              ) : (
                <UserPlus className="w-4 h-4 text-green-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {r.prenom} {r.nom}
                </p>
                {r.detail && (
                  <p className="text-gray-400 text-xs">{r.detail}</p>
                )}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.type === 'membre'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-green-500/20 text-green-400'
                }`}
              >
                {r.type === 'membre' ? 'Membre' : 'Externe'}
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
