/* eslint-disable */
'use client';

import { useState } from 'react';
import { UserCheck, Users, Copy, PlusCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Serie, Match, Member, Joueur } from '@/services/type.ts';

interface SelectionsManagerProps {
  serie: Serie;
  semaine: number;
  membres: Member[];
  matchs: Match[];
  onSelectionsChange?: (selections: Record<string, string[]>) => void;
}

interface MatchWithPlayers extends Match {
  selectedPlayers?: Joueur[];
}

export function SelectionsManager({
  serie,
  semaine,
  membres,
  matchs,
  onSelectionsChange,
}: SelectionsManagerProps) {
  const [matchsWithPlayers, setMatchsWithPlayers] = useState<
    MatchWithPlayers[]
  >(
    matchs.map((match) => {
      // Initialiser avec les joueurs existants s'ils existent
      let existingPlayers: Joueur[] = [];

      if (match.domicile.includes('CTT Frameries')) {
        existingPlayers = match.joueursDomicile || match.joueur_dom || [];
      } else if (match.exterieur.includes('CTT Frameries')) {
        existingPlayers = match.joueursExterieur || match.joueur_ext || [];
      }

      return { ...match, selectedPlayers: existingPlayers };
    })
  );
  const [joueurSelectionne, setJoueurSelectionne] = useState<string>('');

  // Filter CTT Frameries matches only for selections
  const cttFrameriesMatchs = matchsWithPlayers.filter(
    (match) =>
      match.domicile.includes('CTT Frameries') ||
      match.exterieur.includes('CTT Frameries')
  );

  const trierClassements = (a: string, b: string) => {
    const [lettreA, chiffreA] = [a[0], parseInt(a.slice(1)) || 0];
    const [lettreB, chiffreB] = [b[0], parseInt(b.slice(1)) || 0];

    if (lettreA !== lettreB) {
      return lettreA.localeCompare(lettreB);
    }
    return chiffreA - chiffreB;
  };

  const ajouterJoueur = (matchId: string) => {
    if (!joueurSelectionne) return;
    const membre = membres.find((m) => m.id === joueurSelectionne);
    if (!membre) return;

    const newJoueur: Joueur = {
      id: membre.id,
      nom: `${membre.prenom} ${membre.nom}`,
      prenom: membre.prenom || '',
      classement: membre.classement || 'ZZ',
    };

    setMatchsWithPlayers((prev) =>
      prev.map((match) => {
        if (match.id === matchId) {
          const currentPlayers = match.selectedPlayers || [];
          // Limiter à 4 joueurs
          if (currentPlayers.length >= 4) return match;

          const nouveauxJoueurs = [...currentPlayers, newJoueur].sort((a, b) =>
            trierClassements(a.classement || 'ZZ', b.classement || 'ZZ')
          );

          const updatedMatch = {
            ...match,
            selectedPlayers: nouveauxJoueurs,
          };

          // Mettre à jour les sélections pour le parent
          updateSelections(
            matchId,
            nouveauxJoueurs.map((j) => j.id)
          );

          return updatedMatch;
        }
        return match;
      })
    );
    setJoueurSelectionne('');
  };

  const supprimerJoueur = (matchId: string, joueurId: string) => {
    setMatchsWithPlayers((prev) =>
      prev.map((match) => {
        if (match.id === matchId) {
          const nouveauxJoueurs = (match.selectedPlayers || []).filter(
            (j) => j.id !== joueurId
          );

          const updatedMatch = {
            ...match,
            selectedPlayers: nouveauxJoueurs,
          };

          // Mettre à jour les sélections pour le parent
          updateSelections(
            matchId,
            nouveauxJoueurs.map((j) => j.id)
          );

          return updatedMatch;
        }
        return match;
      })
    );
  };

  const updateSelections = (matchId: string, joueurIds: string[]) => {
    const newSelections: Record<string, string[]> = {};

    // Inclure toutes les sélections existantes
    matchsWithPlayers.forEach((match) => {
      if (match.id === matchId) {
        newSelections[matchId] = joueurIds;
      } else if (match.selectedPlayers && match.selectedPlayers.length > 0) {
        newSelections[match.id] = match.selectedPlayers.map((j) => j.id);
      }
    });

    onSelectionsChange?.(newSelections);
  };

  const renderJoueursList = (match: MatchWithPlayers) => {
    const joueurs = match.selectedPlayers || [];

    return (
      <div className="mt-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={joueurSelectionne}
            onValueChange={setJoueurSelectionne}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir un joueur" />
            </SelectTrigger>
            <SelectContent>
              {membres
                .sort((a, b) =>
                  trierClassements(a.classement || 'ZZ', b.classement || 'ZZ')
                )
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.prenom} {m.nom} ({m.classement})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => ajouterJoueur(match.id)}
            disabled={!joueurSelectionne || joueurs.length >= 4}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        <div className="space-y-2">
          {joueurs.length > 0 ? (
            joueurs.map((joueur) => {
              // Utiliser le classement du joueur en priorité, sinon chercher dans les membres
              const membre = membres.find((m) => m.id === joueur.id);
              const classement =
                joueur.classement || membre?.classement || 'N/A';

              // Nettoyer le nom en supprimant les espaces supplémentaires
              const nomAffiche = joueur.nom
                ? joueur.nom.trim()
                : joueur.prenom && joueur.prenom.trim()
                  ? `${joueur.prenom.trim()} ${joueur.nom || ''}`.trim()
                  : membre
                    ? `${membre.prenom || ''} ${membre.nom || ''}`.trim()
                    : 'Joueur inconnu';

              return (
                <div
                  key={joueur.id}
                  className="flex items-center justify-between bg-gray-50 py-2 px-3 rounded"
                >
                  <span className="truncate flex-1 mr-2">
                    {nomAffiche} ({classement})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => supprimerJoueur(match.id, joueur.id)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400 text-sm italic text-center py-4">
              Aucun joueur sélectionné
            </p>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center">
          {joueurs.length}/4 joueurs sélectionnés
        </div>
      </div>
    );
  };

  const copyFromPreviousWeek = () => {
    // Logic to copy selections from previous week
    console.log('[v0] Copying selections from previous week');
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-blue-600" />
            Sélections - {serie.nom} - Semaine {semaine}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyFromPreviousWeek}>
              <Copy className="h-4 w-4 mr-2" />
              Copier semaine précédente
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Encodage des compositions d'équipe pour les matchs de CTT Frameries
        </p>
      </CardHeader>
      <CardContent>
        {cttFrameriesMatchs.length > 0 ? (
          <div className="space-y-6">
            {cttFrameriesMatchs.map((match) => (
              <Card key={match.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {match.domicile} vs {match.exterieur}
                      </h3>
                      <p className="text-sm text-gray-600">{match.date}</p>
                    </div>
                    <Badge
                      variant={
                        match.domicile.includes('CTT Frameries')
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {match.domicile.includes('CTT Frameries')
                        ? 'Domicile'
                        : 'Extérieur'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>{renderJoueursList(match)}</CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Aucun match CTT Frameries</p>
            <p className="text-sm">pour cette semaine</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
