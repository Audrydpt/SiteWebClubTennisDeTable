export interface ResultatData {
  id: string;
  equipe: string;
  adversaire: string;
  score: string;
  date: string;
  semaine: number;
  joueursDomicile?: string[];
  joueursExterieur?: string[];
  joueur_dom?: string[];
  joueur_ext?: string[];
  serieId: string;
  division: string;
  domicile: boolean;
}

export interface SponsorData {
  id: string;
  name: string;
  logoUrl: string;
  texte: string;
  description: string;
  redirectUrl?: string;
  order: number;
  email?: string;
  telephone?: string;
  adresse?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
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
  type: 'image' | 'video';
  folder: string;
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

export interface Joueur {
  id: string;
  nom: string;
  prenom: string;
  classement: string;
}

export interface Match {
  id: string;
  serieId: string;
  semaine: number;
  domicile: string;
  exterieur: string;
  score: string;
  date: string;
  joueursDomicile?: Joueur[];
  joueursExterieur?: Joueur[];
  joueur_dom?: Joueur[];
  joueur_ext?: Joueur[];
  scoresIndividuels?: Record<string, number>;
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

export interface Mousse {
  marque: string;
  nom: string;
  epaisseur: string;
  type?: string;
  couleur: string;
  prix: number;
}

export interface Bois {
  marque: string;
  nom: string;
  type: string;
  prix?: number;
}

export interface Autre {
  nom: string;
  description?: string;
  prix?: number;
}

export interface Commande {
  id: string;
  membre: string;
  mousses: Mousse[];
  bois: Bois[];
  autres: Autre[];
  totalEstime: number;
  dateEnregistrement: string;
}

export interface SelectMembreProps {
  membres: Member[];
  onSelect: (membre: string) => void;
}

export type Member = {
  id: string;
  supabase_uid: string;
  nom: string;
  prenom: string;
  telephone: string;
  classement: string;
  email?: string;
  role?: string; // Optionnel pour les membres
  dateInscription?: string; // Optionnel pour les membres
};
