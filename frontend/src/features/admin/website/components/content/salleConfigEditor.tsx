import { useState, useEffect, useCallback } from 'react';
import { Save, Trash2, RefreshCw, Eye } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { useToast } from '@/hooks/use-toast.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';

interface TableConfig {
  id: string;
  tableNumber: number;
  teamA: string;
  teamB: string;
}

interface MatchConfig {
  id: string;
  trancheHoraire: string;
  tables: TableConfig[];
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface SalleConfig {
  id?: number; // JSON Server génère un number
  matches: MatchConfig[];
}

export default function SalleConfigEditor() {
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL;

  const [config, setConfig] = useState<SalleConfig>({
    matches: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tranchesHoraires = [
    '08h00',
    '09h00',
    '10h00',
    '11h00',
    '12h00',
    '13h00',
    '14h00',
    '15h00',
    '16h00',
    '17h00',
    '18h00',
    '19h00',
    '20h00',
    '21h00',
  ];

  const defaultTranches = ['10h00', '14h00', '19h00'];
  const positions: Array<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  > = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  const initializeDefaultConfig = useCallback(() => {
    // Créer 3 matchs par défaut avec les 3 tranches horaires
    const defaultMatches: MatchConfig[] = defaultTranches.map((tranche, i) => ({
      id: `match-${Date.now()}-${i}`,
      trancheHoraire: tranche,
      tables: [
        {
          id: `table-${Date.now()}-${i * 2 + 1}`,
          tableNumber: i * 2 + 1,
          teamA: `Équipe A${i * 2 + 1}`,
          teamB: `Équipe B${i * 2 + 1}`,
        },
        {
          id: `table-${Date.now()}-${i * 2 + 2}`,
          tableNumber: i * 2 + 2,
          teamA: `Équipe A${i * 2 + 2}`,
          teamB: `Équipe B${i * 2 + 2}`,
        },
      ],
      position: positions[i],
    }));

    setConfig({
      matches: defaultMatches,
    });
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/salleConfig`);

      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }

      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        const latestConfig = data[data.length - 1];
        setConfig({
          id: latestConfig.id,
          matches: latestConfig.matches || [],
        });
      } else {
        initializeDefaultConfig();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors du chargement:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la configuration',
        variant: 'destructive',
      });
      initializeDefaultConfig();
    } finally {
      setLoading(false);
    }
  }, [toast, initializeDefaultConfig, API_URL]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const getMatchesForTranche = (tranche: string) =>
    config.matches.filter((m) => m.trancheHoraire === tranche);

  const addMatch = () => {
    // Vérifier qu'on n'a pas déjà 4 matchs par tranche horaire
    const matchesByTranche = new Map<string, number>();
    config.matches.forEach((m) => {
      matchesByTranche.set(
        m.trancheHoraire,
        (matchesByTranche.get(m.trancheHoraire) || 0) + 1
      );
    });

    // Trouver une tranche qui a moins de 4 matchs
    const availableTranche = tranchesHoraires.find(
      (t) => (matchesByTranche.get(t) || 0) < 4
    );

    if (!availableTranche) {
      toast({
        title: 'Limite atteinte',
        description: 'Maximum 4 matchs par tranche horaire',
        variant: 'destructive',
      });
      return;
    }

    // Trouver une position libre pour cette tranche
    const trancheMatches = config.matches.filter(
      (m) => m.trancheHoraire === availableTranche
    );
    const usedPositions = trancheMatches.map((m) => m.position);
    const availablePosition = positions.find((p) => !usedPositions.includes(p));

    if (!availablePosition) {
      toast({
        title: 'Erreur',
        description: 'Aucune position disponible',
        variant: 'destructive',
      });
      return;
    }

    const nextTableNumber =
      Math.max(
        0,
        ...config.matches.flatMap((m) => m.tables.map((t) => t.tableNumber))
      ) + 1;

    const timestamp = Date.now();
    const newMatch: MatchConfig = {
      id: `match-${timestamp}`,
      trancheHoraire: availableTranche,
      tables: [
        {
          id: `table-${timestamp}-1`,
          tableNumber: nextTableNumber,
          teamA: `Équipe A${nextTableNumber}`,
          teamB: `Équipe B${nextTableNumber}`,
        },
        {
          id: `table-${timestamp}-2`,
          tableNumber: nextTableNumber + 1,
          teamA: `Équipe A${nextTableNumber + 1}`,
          teamB: `Équipe B${nextTableNumber + 1}`,
        },
      ],
      position: availablePosition,
    };

    setConfig({ ...config, matches: [...config.matches, newMatch] });
  };

  const removeMatch = (matchId: string) => {
    setConfig({
      ...config,
      matches: config.matches.filter((m) => m.id !== matchId),
    });
  };

  const updateMatch = (
    matchId: string,
    field: keyof MatchConfig,
    value: any
  ) => {
    setConfig({
      ...config,
      matches: config.matches.map((m) =>
        m.id === matchId ? { ...m, [field]: value } : m
      ),
    });
  };

  const updateTable = (
    matchId: string,
    tableIndex: number,
    field: keyof TableConfig,
    value: string | number
  ) => {
    setConfig({
      ...config,
      matches: config.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              tables: m.tables.map((t, idx) =>
                idx === tableIndex ? { ...t, [field]: value } : t
              ),
            }
          : m
      ),
    });
  };

  const saveConfig = async () => {
    try {
      setSaving(true);

      // S'assurer que tous les objets ont des IDs valides
      const dataToSave = {
        matches: config.matches.map((match) => ({
          ...match,
          id: match.id || `match-${Date.now()}-${Math.random()}`,
          tables: match.tables.map((table) => ({
            ...table,
            id: table.id || `table-${Date.now()}-${Math.random()}`,
          })),
        })),
      };

      let response;

      if (config.id) {
        // Mise à jour
        response = await fetch(`${API_URL}/salleConfig/${config.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSave),
        });
      } else {
        // Création - Ne pas inclure l'ID, laisser JSON Server le générer
        response = await fetch(`${API_URL}/salleConfig`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSave),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        // eslint-disable-next-line no-console
        console.error('Erreur serveur:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const savedConfig = await response.json();
      setConfig({ id: savedConfig.id, matches: config.matches });

      toast({
        title: 'Succès',
        description: 'Configuration sauvegardée avec succès',
      });

      // Recharger pour avoir l'ID correct
      await loadConfig();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors de la sauvegarde:', err);
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : 'Impossible de sauvegarder la configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async () => {
    if (!config.id) return;

    try {
      const response = await fetch(`${API_URL}/salleConfig/${config.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      toast({
        title: 'Succès',
        description: 'Configuration supprimée',
      });

      initializeDefaultConfig();
      setShowDeleteConfirm(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors de la suppression:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la configuration',
        variant: 'destructive',
      });
    }
  };

  const getPositionLabel = (position: string) => {
    const labels = {
      'top-left': 'Haut gauche',
      'top-right': 'Haut droite',
      'bottom-left': 'Bas gauche',
      'bottom-right': 'Bas droite',
    };
    return labels[position as keyof typeof labels] || position;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Configuration de la Salle
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez les matchs par tranches horaires (max 4 matchs par tranche)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Masquer' : 'Prévisualiser'}
          </Button>
          <Button onClick={loadConfig} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recharger
          </Button>
          {config.id && (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
          <Button onClick={saveConfig} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Bouton pour ajouter un match */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {config.matches.length} match(s) configuré(s) - Max 4 par tranche
          horaire
        </p>
        <Button onClick={addMatch} size="sm">
          Ajouter un match
        </Button>
      </div>

      {/* Affichage groupé par tranche horaire */}
      <div className="space-y-6">
        {tranchesHoraires.map((tranche) => {
          const trancheMatches = config.matches.filter(
            (m) => m.trancheHoraire === tranche
          );

          if (trancheMatches.length === 0) return null;

          return (
            <div key={tranche} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold">
                  {tranche}
                </div>
                <span className="text-sm text-gray-600">
                  ({trancheMatches.length}/4 matchs)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {trancheMatches.map((match) => (
                  <Card key={match.id} className="border-2 border-blue-200">
                    <CardHeader className="bg-blue-50 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {getPositionLabel(match.position)}
                        </CardTitle>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeMatch(match.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {/* Select de tranche horaire */}
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Changer la tranche horaire
                        </Label>
                        <Select
                          value={match.trancheHoraire}
                          onValueChange={(value) =>
                            updateMatch(match.id, 'trancheHoraire', value)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tranchesHoraires.map((horaire) => (
                              <SelectItem key={horaire} value={horaire}>
                                {horaire}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tables du match */}
                      <div className="space-y-2">
                        {match.tables.map((table, tableIndex) => (
                          <Card key={table.id} className="bg-gray-50">
                            <CardContent className="pt-3 pb-3">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Table</Label>
                                  <Input
                                    type="number"
                                    className="h-8 text-sm"
                                    value={table.tableNumber}
                                    onChange={(e) =>
                                      updateTable(
                                        match.id,
                                        tableIndex,
                                        'tableNumber',
                                        parseInt(e.target.value, 10) || 1
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Équipe A</Label>
                                  <Input
                                    className="h-8 text-sm"
                                    value={table.teamA}
                                    onChange={(e) =>
                                      updateTable(
                                        match.id,
                                        tableIndex,
                                        'teamA',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Équipe A"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Équipe B</Label>
                                  <Input
                                    className="h-8 text-sm"
                                    value={table.teamB}
                                    onChange={(e) =>
                                      updateTable(
                                        match.id,
                                        tableIndex,
                                        'teamB',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Équipe B"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {config.matches.length === 0 && (
          <Card className="bg-gray-50">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">
                Aucun match configuré. Cliquez sur "Ajouter un match" pour
                commencer.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prévisualisation */}
      {showPreview && config.matches.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Prévisualisation - Disposition en carré</CardTitle>
            <CardDescription>
              Aperçu de la disposition dans la salle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 min-h-[600px]">
              {positions.map((position) => {
                const match = config.matches.find(
                  (m) => m.position === position
                );

                if (!match) {
                  return (
                    <div
                      key={position}
                      className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
                    >
                      <p className="text-gray-400">
                        Position libre: {getPositionLabel(position)}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={position}
                    className="border-2 border-blue-300 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100"
                  >
                    {/* Horaire */}
                    <div className="text-center mb-4">
                      <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full font-bold">
                        {match.trancheHoraire}
                      </div>
                    </div>

                    {/* Tables */}
                    <div className="space-y-3">
                      {match.tables.map((table) => (
                        <div
                          key={table.id}
                          className="bg-white rounded-lg p-3 shadow"
                        >
                          <div className="text-center mb-2">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                              Table {table.tableNumber}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-green-100 p-2 rounded text-sm">
                              <span className="font-semibold">A:</span>{' '}
                              {table.teamA}
                            </div>
                            <div className="text-center text-xs font-bold text-gray-500">
                              VS
                            </div>
                            <div className="bg-red-100 p-2 rounded text-sm">
                              <span className="font-semibold">B:</span>{' '}
                              {table.teamB}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette configuration ? Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteConfig} className="bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
