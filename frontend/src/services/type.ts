export interface ResultatData {
  id: string;
  equipe: string;
  adversaire: string;
  score: string;
  division: string;
  domicile: boolean;
}

export interface SponsorData {
  id: string;
  name: string;
  texte: string;
  logoUrl: string;
  redirectUrl: string;
  order: number;
}

export interface TournoiData {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
}

export interface Image {
  id: string;
  label: string;
  url: string;
  uploadDate: string;
}

export interface ActualiteData {
  imageUrl: string | undefined;
  id: string;
  title: string;
  content: string;
  redirectUrl: string;
  order: number;
}

export type SaisonStatut = 'En cours' | 'Terminée' | 'Archivée';

export interface Equipe {
  id: string;
  nom: string;
  serieId: string;
}

export interface Serie {
  id: string;
  nom: string;
  equipes: Equipe[];
}

export interface Match {
  id: string;
  serieId: string;
  semaine: number;
  domicile: string;
  exterieur: string;
  score: string;
  date: string;
}

export interface Saison {
  id: string;
  label: string;
  statut: SaisonStatut;
  equipesClub: Equipe[];
  series: Serie[];
  calendrier: Match[];
}

export interface ClassementEntry {
  position: number;
  nom: string;
  joues: number;
  victoires: number;
  nuls: number;
  defaites: number;
  points: number;
}
