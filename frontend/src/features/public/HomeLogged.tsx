/* eslint-disable @typescript-eslint/no-explicit-any,no-nested-ternary,@typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Calendar, Users, Trophy, MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { fetchSaisonEnCours } from '@/services/api.ts';
import { Joueur, Match } from '@/services/type.ts';
import supabase from '@/lib/supabaseClient.ts';

export default function HomeLogged() {
  const [member, setMember] = useState<Joueur | null>(null);
  const [mesMatchs, setMesMatchs] = useState<Match[]>([]);
  const [equipiers, setEquipiers] = useState<Joueur[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getInitials = (nom: string, prenom: string) =>
    `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

  const formatDateFR = (dateString?: string) => {
    if (!dateString) return 'Date à venir';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // 🔄 Récupération des infos JSON Server du membre connecté
  useEffect(() => {
    const fetchMemberData = async () => {
      setLoading(true);
      setError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        setError('Utilisateur non authentifié.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/membres?supabase_uid=${user.id}`
        );
        const users: Joueur[] = await res.json();
        setMember(users[0] || null);
      } catch (err) {
        setError('Erreur de chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!member) return;

      const saison = await fetchSaisonEnCours();
      if (!saison?.calendrier) return;

      const matchs = saison.calendrier.filter((match: Match) => {
        const tousJoueurs = [
          ...(match.joueur_dom || []),
          ...(match.joueur_ext || []),
        ];
        return tousJoueurs.some((j) => j.id === member.id) && !match.score;
      });

      setMesMatchs(matchs);

      if (matchs.length > 0) {
        const prochainMatch = matchs[0];
        const equipiersMatch = [
          ...(prochainMatch.joueur_dom || []),
          ...(prochainMatch.joueur_ext || []),
        ].filter((j) => j.id !== member.id);
        setEquipiers(equipiersMatch);
      }
    };

    loadData();
  }, [member]);

  if (loading)
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  if (error) return <div className="text-red-500">{error}</div>;
  if (!member) return <div>Aucun membre trouvé.</div>;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* En-tête joueur */}
      <div className="bg-gradient-to-r from-[#F1C40F] to-[#D4AC0D] text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {member.prenom} {member.nom}
            </h1>
            <p className="opacity-90">Classement: {member.classement}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Score concours</p>
            <p className="text-2xl font-bold">--</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochains matchs */}
        <Card className="bg-white border border-[#E0E0E0]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Mes prochains matchs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mesMatchs.map((match) => (
                <div
                  key={match.id}
                  className="p-4 border border-[#E0E0E0] rounded-lg bg-[#F9F9F9]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {match.domicile.includes('CTT Frameries') ? (
                        <>
                          <Badge variant="secondary">Domicile</Badge>
                          <span className="font-semibold">
                            {match.domicile}
                          </span>
                          <span className="font-semibold">vs</span>
                          <span>{match.exterieur}</span>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline">Extérieur</Badge>
                          <span>{match.domicile}</span>
                          <span className="font-semibold">vs</span>
                          <span className="font-semibold">
                            {match.exterieur}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDateFR(match.date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{match.domicile}</span>
                  </div>
                </div>
              ))}

              {mesMatchs.length === 0 && (
                <div className="text-gray-500 text-center p-4">
                  Aucun match prévu.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mon équipe */}
        <Card className="bg-white border border-[#E0E0E0]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Mon équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mesMatchs.length > 1 ? (
              <Tabs defaultValue={mesMatchs[0].id}>
                <TabsList>
                  {mesMatchs.map((match) => (
                    <TabsTrigger key={match.id} value={match.id}>
                      {formatDateFR(match.date)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {mesMatchs.map((match) => {
                  const joueurs = [
                    ...(match.joueur_dom || []),
                    ...(match.joueur_ext || []),
                  ].sort((a, b) => a.classement.localeCompare(b.classement));

                  return (
                    <TabsContent key={match.id} value={match.id}>
                      <div className="space-y-3">
                        {joueurs.map((e) => {
                          const isMe = e.id === member.id;
                          return (
                            <div
                              key={`${match.id}-${e.id}`}
                              className={`flex items-center space-x-3 p-3 rounded-lg ${
                                isMe ? 'bg-[#F1C40F]' : 'bg-[#FFF8DC]'
                              }`}
                            >
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(e.nom, e.prenom || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p
                                  className={`font-semibold ${
                                    isMe ? 'underline font-bold' : ''
                                  }`}
                                >
                                  {e.nom}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {e.classement}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : mesMatchs.length === 1 ? (
              <div className="space-y-3">
                {[
                  ...(mesMatchs[0].joueur_dom || []),
                  ...(mesMatchs[0].joueur_ext || []),
                ]
                  .sort((a, b) => a.classement.localeCompare(b.classement))
                  .map((e) => {
                    const isMe = e.id === member.id;
                    return (
                      <div
                        key={`${mesMatchs[0].id}-${e.id}`}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          isMe ? 'bg-[#F1C40F]' : 'bg-[#FFF8DC]'
                        }`}
                      >
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(e.nom, e.prenom || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p
                            className={`font-semibold ${
                              isMe ? 'underline font-bold' : ''
                            }`}
                          >
                            {e.nom}
                          </p>
                          <p className="text-sm text-gray-600">
                            {e.classement}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-gray-500 text-center p-4">
                Aucun match prévu.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <Card className="bg-white border border-[#E0E0E0]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Mes statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Section en développement
            </h3>
            <p className="text-gray-500">La section sera bientôt disponible.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
