import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  id?: string;
  matches: MatchConfig[];
}

export default function SalleView() {
  const [config, setConfig] = useState<SalleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const API_URL = import.meta.env.VITE_API_URL;

  const positions: Array<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  > = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  const getPositionLabel = (position: string) => {
    const labels = {
      'top-left': 'Haut gauche',
      'top-right': 'Haut droite',
      'bottom-left': 'Bas gauche',
      'bottom-right': 'Bas droite',
    };
    return labels[position as keyof typeof labels] || position;
  };

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/salleConfig`);
      const data = await response.json();

      if (data && data.length > 0) {
        const latestConfig = data[data.length - 1];
        setConfig({
          id: latestConfig.id,
          matches: latestConfig.matches || [],
        });
        setLastUpdate(new Date());
      } else {
        setConfig(null);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors du chargement:', error);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();

    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      loadConfig();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  if (!config || config.matches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Configuration non disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Aucune configuration de salle n&apos;est actuellement définie.
            </p>
            <Button onClick={loadConfig} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Configuration de la Salle
          </h1>
          <p className="text-gray-600">
            Disposition des matchs par tranches horaires
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
            <Button
              onClick={loadConfig}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Rafraîchir
            </Button>
          </div>
        </div>

        {/* Disposition en carré */}
        <Card className="shadow-2xl">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-h-[600px] md:min-h-[800px]">
              {positions.map((position) => {
                const match = config.matches.find(
                  (m) => m.position === position
                );

                if (!match) {
                  return (
                    <div
                      key={position}
                      className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 p-4"
                    >
                      <p className="text-gray-400 text-center">
                        Aucun match
                        <br />
                        <span className="text-sm">
                          ({getPositionLabel(position)})
                        </span>
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={position}
                    className="border-4 border-blue-400 rounded-xl p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 shadow-lg"
                  >
                    {/* Horaire */}
                    <div className="text-center mb-6">
                      <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-xl md:text-2xl shadow-lg">
                        {match.trancheHoraire}
                      </div>
                    </div>

                    {/* Tables */}
                    <div className="space-y-4">
                      {match.tables.map((table) => (
                        <div
                          key={table.id}
                          className="bg-white rounded-xl p-4 md:p-5 shadow-xl transform hover:scale-105 transition-transform duration-200"
                        >
                          {/* Numéro de table */}
                          <div className="text-center mb-4">
                            <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full text-base md:text-lg font-bold shadow-md">
                              Table {table.tableNumber}
                            </div>
                          </div>

                          {/* Équipes */}
                          <div className="space-y-3">
                            {/* Équipe A */}
                            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 md:p-4 rounded-lg shadow-md">
                              <div className="text-xs font-semibold mb-1 opacity-90">
                                ÉQUIPE A
                              </div>
                              <div className="text-base md:text-lg font-bold break-words">
                                {table.teamA}
                              </div>
                            </div>

                            {/* VS */}
                            <div className="text-center">
                              <div className="inline-block bg-gray-800 text-white px-4 py-1 rounded-full font-bold text-sm">
                                VS
                              </div>
                            </div>

                            {/* Équipe B */}
                            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 md:p-4 rounded-lg shadow-md">
                              <div className="text-xs font-semibold mb-1 opacity-90">
                                ÉQUIPE B
                              </div>
                              <div className="text-base md:text-lg font-bold break-words">
                                {table.teamB}
                              </div>
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

        {/* Légende */}
        <div className="text-center text-sm text-gray-500">
          <p>Affichage automatiquement mis à jour toutes les 30 secondes</p>
        </div>
      </div>
    </div>
  );
}
