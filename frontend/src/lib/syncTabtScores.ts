/* eslint-disable */
// Synchronisation des scores TABT vers le backend JSON
// Utilisation : import { syncTabtScores } from '@/lib/syncTabtScores';
// Note: Synchronisation locale uniquement en raison des limitations du serveur JSON

// Déclaration pour TypeScript
declare const window: any;

export async function syncTabtScores() {
  const backendUrl = import.meta.env.VITE_API_URL;
  const tabtUrl = 'https://php-api-psi.vercel.app/api/matches.php';
  let updated = 0;
  const errors: string[] = [];
  const notMatched: string[] = [];

  function normalizeTeam(s?: string) {
    return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function cleanForJson(obj: any) {
    // On retire les propriétés non sérialisables ou trop volumineuses si besoin
    // Ici, on clone simplement, mais on pourrait filtrer certains champs si nécessaire
    return JSON.parse(JSON.stringify(obj));
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  try {
    // 1. Charger toutes les saisons
    const backendRes = await fetch(`${backendUrl}/saisons`);
    const saisons = await backendRes.json();

    // 2. Charger tous les matchs TABT
    const tabtRes = await fetch(tabtUrl);
    const tabtData = await tabtRes.json();
    const tabtMatches = tabtData.data || tabtData;

    // 3. Parcourir les saisons
    for (const saison of saisons) {
      if (!saison.calendrier) continue;

      let saisonModifiee = false;
      const changedMatches: {
        id: string;
        score?: string;
        scoresIndividuels?: any;
      }[] = [];

      for (const match of saison.calendrier) {
        // 🔍 Recherche du match TABT
        const tabtMatch = tabtMatches.find((m: any) => {
          if (
            match.id &&
            (m.matchId === match.id ||
              String(m.matchUniqueId) === String(match.id))
          ) {
            return true;
          }

          // Fallback : date + équipes + division
          const sameDate =
            (m.date || '').split('T')[0] === (match.date || '').split('T')[0];
          const home = normalizeTeam(`${m.homeClub} ${m.homeTeam}`);
          const away = normalizeTeam(`${m.awayClub} ${m.awayTeam}`);
          const home2 = normalizeTeam(match.domicile);
          const away2 = normalizeTeam(match.exterieur);
          const sameTeams =
            (home === home2 && away === away2) ||
            (home === away2 && away === home2);
          const sameDivision = String(m.divisionId) === String(match.serieId);

          return sameDate && sameTeams && sameDivision;
        });

        // 🎯 Mise à jour si score trouvé
        if (tabtMatch && tabtMatch.score && tabtMatch.score !== match.score) {
          // Mise à jour locale et collecter le changement
          match.score = tabtMatch.score;
          updated++;
          saisonModifiee = true;
          changedMatches.push({
            id: match.id,
            score: tabtMatch.score,
            scoresIndividuels: tabtMatch.scoresIndividuels || undefined,
          });
        } else if (!tabtMatch) {
          const key =
            match.id ??
            `<unknown:${match.domicile || match.exterieur || 'na'}>`;
          if (!notMatched.includes(key)) notMatched.push(key);
        }
      }

      // 4. Si la saison a été modifiée, on synchronise localement uniquement
      if (saisonModifiee && changedMatches.length > 0) {
        try {
          console.log(`Synchronisation locale de ${changedMatches.length} match(s) pour la saison ${saison.id}`);

          // Synchronisation locale uniquement - pas de sauvegarde serveur par match
          for (const cm of changedMatches) {
            console.log(`Mise à jour locale du match ${cm.id}: score "${cm.score}"`);

            // Déclencher les événements updateMatch pour l'UI
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('updateMatch', {
                  detail: {
                    matchId: cm.id,
                    saisonId: saison.id,
                    updates: {
                      score: cm.score,
                      scoresIndividuels: cm.scoresIndividuels,
                      saisonId: saison.id,
                    },
                  },
                })
              );
            }
          }

          // 🔥 Sauvegarde serveur : PATCH global sur la saison
          try {
            const saveRes = await fetch(`${backendUrl}/saisons/${saison.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                calendrier: saison.calendrier // uniquement le calendrier modifié
              }),
            });
            if (!saveRes.ok) {
              const errText = await saveRes.text();
              throw new Error(`Erreur serveur: ${saveRes.status} - ${errText}`);
            }
            console.log(`Saison ${saison.id} sauvegardée sur le serveur (scores synchronisés).`);
          } catch (err: any) {
            console.error(`Erreur lors de la sauvegarde de la saison ${saison.id}:`, err);
            errors.push(`Erreur serveur pour la saison ${saison.id}: ${err?.message || err}`);
          }

          console.log(`Synchronisation locale terminée pour ${changedMatches.length} match(s)`);
        } catch (err: any) {
          console.error('Erreur lors de la synchronisation locale des matchs:', err);
          errors.push(
            `Erreur synchronisation locale saison ${saison.id}: ${err?.message || err}`
          );
        }
      }
    }

    // 📌 Log des non-matchés
    if (notMatched.length > 0) {
      errors.push(`Aucun match TABT trouvé pour : ${notMatched.join(', ')}`);
    }

    return { updated, errors };
  } catch (err) {
    const msg = (err as any)?.message || 'Erreur globale de synchronisation';
    return { updated, errors: [msg] };
  }
}
