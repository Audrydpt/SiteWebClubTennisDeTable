/* eslint-disable */
import { Match, Serie, ClassementEntry } from '@/services/type.ts';

// Fonction pour calculer les points d'un match
const getPointsFromScore = (
  scoreEquipe: number | string,
  scoreAdversaire: number | string,
  forfait: string | null = null
): number => {
  // Cas de forfait général - match non comptabilisé
  if (forfait === 'fg' || forfait === 'fg-d' || forfait === 'fg-e') return 0;

  // Cas de forfait simple
  if (forfait === 'ff') return 0; // L'équipe forfait reçoit 0 point
  if (forfait === 'ff-adversaire') return 3; // L'équipe adverse au forfait reçoit 3 points

  // Cas normal avec score numérique
  if (typeof scoreEquipe === 'number' && typeof scoreAdversaire === 'number') {
    if (scoreEquipe > scoreAdversaire) return 3;
    if (scoreEquipe === scoreAdversaire) return 2;
    return 1;
  }

  return 0;
};

const calculerClassement = (
  serie: Serie,
  calendrier: Match[]
): ClassementEntry[] => {
  const stats = new Map<string, Omit<ClassementEntry, 'position' | 'nom'>>();
  const duels: Record<
    string,
    Record<string, { gagne: number; perdu: number }>
  > = {};

  serie.equipes.forEach((equipe) => {
    stats.set(equipe.nom, {
      joues: 0,
      victoires: 0,
      nuls: 0,
      defaites: 0,
      points: 0,
    });
    duels[equipe.nom] = {};
  });

  const matchsSerie = calendrier.filter(
    (m) => m.serieId === serie.id && m.score
  );

  matchsSerie.forEach((match) => {
    // Ignorer les forfaits généraux et les matchs BYE dans les statistiques
    if (match.score === 'fg' || match.score === 'fg-d' || match.score === 'fg-e' ||
      match.score.toLowerCase() === 'bye') return;

    // Ignorer les matchs contre BYE
    if (match.domicile.toLowerCase().includes('bye') ||
      match.exterieur.toLowerCase().includes('bye')) return;

    const statsD = stats.get(match.domicile);
    const statsE = stats.get(match.exterieur);

    if (!statsD || !statsE) return;

    // Traitement des forfaits
    if (match.score === 'ff-d') {
      // Équipe à domicile forfait
      statsD.joues += 1;
      statsE.joues += 1;
      statsD.defaites += 1;
      statsE.victoires += 1;
      statsD.points += getPointsFromScore(0, 0, 'ff');
      statsE.points += getPointsFromScore(0, 0, 'ff-adversaire');

      duels[match.exterieur][match.domicile] = {
        ...(duels[match.exterieur][match.domicile] || { gagne: 0, perdu: 0 }),
        gagne: (duels[match.exterieur][match.domicile]?.gagne || 0) + 1,
      };
      duels[match.domicile][match.exterieur] = {
        ...(duels[match.domicile][match.exterieur] || { gagne: 0, perdu: 0 }),
        perdu: (duels[match.domicile][match.exterieur]?.perdu || 0) + 1,
      };
      return;
    }

    if (match.score === 'ff-e') {
      // Équipe à l'extérieur forfait
      statsD.joues += 1;
      statsE.joues += 1;
      statsD.victoires += 1;
      statsE.defaites += 1;
      statsD.points += getPointsFromScore(0, 0, 'ff-adversaire');
      statsE.points += getPointsFromScore(0, 0, 'ff');

      duels[match.domicile][match.exterieur] = {
        ...(duels[match.domicile][match.exterieur] || { gagne: 0, perdu: 0 }),
        gagne: (duels[match.domicile][match.exterieur]?.gagne || 0) + 1,
      };
      duels[match.exterieur][match.domicile] = {
        ...(duels[match.exterieur][match.domicile] || { gagne: 0, perdu: 0 }),
        perdu: (duels[match.exterieur][match.domicile]?.perdu || 0) + 1,
      };
      return;
    }

    // Traitement des scores normaux
    const [scoreDomicile, scoreExterieur] = match.score.split('-').map(Number);
    if (isNaN(scoreDomicile) || isNaN(scoreExterieur)) return;

    // Le reste du code pour gérer les scores normaux reste inchangé
    statsD.joues += 1;
    statsE.joues += 1;

    statsD.points += getPointsFromScore(scoreDomicile, scoreExterieur);
    statsE.points += getPointsFromScore(scoreExterieur, scoreDomicile);

    if (scoreDomicile > scoreExterieur) {
      statsD.victoires += 1;
      statsE.defaites += 1;
      duels[match.domicile][match.exterieur] = {
        ...(duels[match.domicile][match.exterieur] || { gagne: 0, perdu: 0 }),
        gagne: (duels[match.domicile][match.exterieur]?.gagne || 0) + 1,
      };
      duels[match.exterieur][match.domicile] = {
        ...(duels[match.exterieur][match.domicile] || { gagne: 0, perdu: 0 }),
        perdu: (duels[match.exterieur][match.domicile]?.perdu || 0) + 1,
      };
    } else if (scoreDomicile < scoreExterieur) {
      statsE.victoires += 1;
      statsD.defaites += 1;
      duels[match.exterieur][match.domicile] = {
        ...(duels[match.exterieur][match.domicile] || { gagne: 0, perdu: 0 }),
        gagne: (duels[match.exterieur][match.domicile]?.gagne || 0) + 1,
      };
      duels[match.domicile][match.exterieur] = {
        ...(duels[match.domicile][match.exterieur] || { gagne: 0, perdu: 0 }),
        perdu: (duels[match.domicile][match.exterieur]?.perdu || 0) + 1,
      };
    } else {
      statsD.nuls += 1;
      statsE.nuls += 1;
    }
  });

  // Fonction de départage direct
  const compareEquipes = (a: any, b: any): number => {
    if (b.points !== a.points) return b.points - a.points;

    const duelA = duels[a.nom]?.[b.nom];
    const duelB = duels[b.nom]?.[a.nom];

    const aGagne = duelA?.gagne || 0;
    const bGagne = duelB?.gagne || 0;

    if (aGagne > 0 && bGagne === 0) return -1;
    if (bGagne > 0 && aGagne === 0) return 1;

    return 0; // égalité
  };

  const classementArray = Array.from(stats.entries())
    .map(([nom, data]) => ({ nom, ...data }))
    .sort(compareEquipes)
    .map((entry, index) => ({ ...entry, position: index + 1 }));

  return classementArray;
};

export default calculerClassement;