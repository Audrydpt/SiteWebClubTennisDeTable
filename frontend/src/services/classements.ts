import { Match, Serie, ClassementEntry } from '@/services/type.ts';

// Fonction pour calculer les points d'un match
const getPointsFromScore = (
  scoreEquipe: number,
  scoreAdversaire: number
): number => {
  if (scoreEquipe > scoreAdversaire) return 3; // Victoire
  if (scoreEquipe === scoreAdversaire) return 2; // Nul
  return 1; // Défaite
};

const calculerClassement = (
  serie: Serie,
  calendrier: Match[]
): ClassementEntry[] => {
  const stats = new Map<string, Omit<ClassementEntry, 'position' | 'nom'>>();

  // Initialiser les stats pour chaque équipe de la série
  serie.equipes.forEach((equipe) => {
    stats.set(equipe.nom, {
      joues: 0,
      victoires: 0,
      nuls: 0,
      defaites: 0,
      points: 0,
    });
  });

  // Parcourir tous les matchs de la saison pour cette série
  const matchsSerie = calendrier.filter(
    (m) => m.serieId === serie.id && m.score.includes('-')
  );

  matchsSerie.forEach((match) => {
    const [scoreDomicile, scoreExterieur] = match.score.split('-').map(Number);
    if (Number.isNaN(scoreDomicile) || Number.isNaN(scoreExterieur)) return; // Ignorer si le score est invalide

    const statsDomicile = stats.get(match.domicile);
    const statsExterieur = stats.get(match.exterieur);

    if (statsDomicile) {
      statsDomicile.joues += 1;
      statsDomicile.points += getPointsFromScore(scoreDomicile, scoreExterieur);
      if (scoreDomicile > scoreExterieur) statsDomicile.victoires += 1;
      else if (scoreDomicile === scoreExterieur) statsDomicile.nuls += 1;
      else statsDomicile.defaites += 1;
    }

    if (statsExterieur) {
      statsExterieur.joues += 1;
      statsExterieur.points += getPointsFromScore(
        scoreExterieur,
        scoreDomicile
      );
      if (scoreExterieur > scoreDomicile) statsExterieur.victoires += 1;
      else if (scoreExterieur === scoreDomicile) statsExterieur.nuls += 1;
      else statsExterieur.defaites += 1;
    }
  });

  // Convertir la map en tableau, trier et ajouter la position
  const classementArray = Array.from(stats.entries())
    .map(([nom, data]) => ({ nom, ...data }))
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({ ...entry, position: index + 1 }));

  return classementArray;
};

export default calculerClassement;
