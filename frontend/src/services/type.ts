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

export interface ClubInfo {
  id: string;
  nom: string; // Nom du club (ex: "Sporting Frameries")
  localite?: string;
  salle?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  site?: string;
}

export interface Equipe {
  id: string;
  nom: string;
  serieId: string;
  clubId?: string; // Référence au club parent
}

export interface Serie {
  saisonId: string;
  id: string;
  nom: string;
  equipes: Equipe[];
}

export interface Joueur {
  id: string;
  nom: string;
  prenom: string;
  classement: string;
  wo?: string; // "y" pour forfait, "n" pour normal (ou undefined)
  indexListeForce: number;
}

export interface Match {
  saisonId: string;
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
  clubs?: ClubInfo[]; // Nouvelle propriété pour stocker les infos des clubs
  infosPersonnalisees?: InfosPersonnalisees[]; // Nouvelle propriété
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

export interface CommandeItem {
  id: string;
  name: string;
  price: string;
  quantity: string;
  category: 'mousse' | 'bois' | 'autre';
  epaisseur?: string;
  couleur?: string;
  fournisseur?: string;
  type?: string;
  description?: string;
}

export interface CommandeMember {
  memberId: string;
  items: CommandeItem[];
  subtotal: string;
}

export interface Commande {
  id: string;
  name: string;
  date: string;
  dateFin?: string;
  members: CommandeMember[];
  total: string;
  statut: 'open' | 'closed';
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
  indexListeForce: number; // Maintenant requis
};

export interface Mousse {
  marque: string;
  nom: string;
  epaisseur: string;
  couleur: string;
  prix: number;
  quantity: number;
}

export interface Bois {
  marque: string;
  nom: string;
  type: string;
  prix: number;
  quantity: number;
}

export interface Autre {
  marque: string;
  nom: string;
  description?: string;
  prix: number;
  quantity: number;
}

export interface InfosPersonnalisees {
  id: string;
  matchId: string;
  clubAdverse: string;
  salle?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  horaire?: string;
  commentaire?: string;
  dateCreation: string;
  dateModification?: string;
}

export interface Absence {
  id: string;
  memberId: string;
  memberName: string;
  date: string; // Une seule date au lieu de dateDebut/dateFin
  details: string; // Remplace motif et type
  statut: 'active' | 'terminee';
  dateCreation: string;
}

export interface Training {
  id: string;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  lieu: string;
  type: 'entrainement' | 'stage' | 'competition';
  niveau: 'debutant' | 'intermediaire' | 'avance' | 'tous';
  participants: string[]; // IDs des membres
  maxParticipants?: number;
  description?: string;
  responsable: string;
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
}

export interface Plat {
  id: string;
  nom: string;
  description?: string;
  prix: number;
  disponible: boolean;
  allergenes?: string[];
  categorie: 'entree' | 'plat' | 'dessert' | 'boisson';
  dateCreation: string;
}

export interface ZoneCommande {
  id: string;
  nom: string; // Ex: "Menu du samedi 15 décembre"
  date: string;
  dateLimiteCommande: string;
  platsDisponibles: string[]; // IDs des plats disponibles pour cette zone
  commandes: {
    memberId: string;
    memberName: string;
    items: {
      platId: string;
      platNom: string;
      quantite: number;
      prix: number;
    }[];
    total: number;
    statut: 'en_attente' | 'confirmee' | 'payee';
    dateCommande: string;
  }[];
  statut: 'ouvert' | 'ferme' | 'termine';
}

// Garder l'ancien type pour compatibilité mais le marquer comme déprécié
/** @deprecated Utiliser Plat et ZoneCommande à la place */
export interface MenuItem {
  id: string;
  nom: string;
  description?: string;
  prix: number;
  disponible: boolean;
  allergenes?: string[];
}

/** @deprecated Utiliser ZoneCommande à la place */
export interface FoodMenu {
  id: string;
  date: string;
  entrees: MenuItem[];
  plats: MenuItem[];
  desserts: MenuItem[];
  boissons: MenuItem[];
  commandes: {
    memberId: string;
    memberName: string;
    items: {
      itemId: string;
      nom: string;
      quantite: number;
      prix: number;
    }[];
    total: number;
    statut: 'en_attente' | 'confirmee' | 'payee';
    dateCommande: string;
  }[];
  dateLimiteCommande: string;
  statut: 'ouvert' | 'ferme' | 'termine';
}

export interface FacebookConfig {
  id: string;
  accessToken: string;
  pageId: string;
  appId: string;
  enabled: boolean;
  lastSync?: string;
}

export interface FacebookPost {
  id: string;
  message: string;
  type: 'training' | 'news' | 'event';
  relatedId?: string; // ID de l'entraînement/actualité/événement
  publishedAt: string;
  facebookPostId?: string;
  status: 'pending' | 'published' | 'failed';
  error?: string;
}
