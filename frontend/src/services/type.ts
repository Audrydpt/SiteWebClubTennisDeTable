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
  archived?: boolean; // Nouvelle propriété pour l'archivage
}

export type SaisonStatut = 'En cours' | 'Terminée' | 'Archivée';

export interface ClubInfo {
  id?: string;
  nom: string;
  localite?: string;
  salle?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  site?: string;
  // Nouvelles propriétés depuis TABT
  clubId?: string;
  clubLongName?: string;
  venues?: VenueInfo[];
}

export interface VenueInfo {
  name: string;
  fullAddress: string;
  phone?: string;
  comment?: string;
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
  groupe?: string; // Nouveau : permet d'assigner un joueur à un groupe d'entraînement
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
  heure?: string; // Ajout du champ heure
  lieu?: string; // Ajout du champ lieu (optionnel)
  joueursDomicile?: Joueur[];
  joueursExterieur?: Joueur[];
  joueur_dom?: Joueur[];
  joueur_ext?: Joueur[];
  scoresIndividuels?: Record<string, number>;
}

export interface Saison {
  id: string;
  label: string;
  statut: 'En cours' | 'Archivée' | 'À venir';
  equipesClub: { id: string; nom: string; serieId: string; clubId?: string }[];
  series: Serie[];
  calendrier: Match[];
  clubs: ClubInfo[];
  infosPersonnalisees: InfosPersonnalisees[];
  // Nouvelle propriété pour stocker les données TABT
  clubsTabt?: ClubInfo[];
  dateMAJClubsTabt?: string;
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
  groupe?: string; // Nouveau : permet d'assigner un membre à un groupe
  lastLog?: string; // Date et heure de la dernière connexion (ISO string)
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
  groupe?: string; // Nouveau : identifie le groupe cible de l'entraînement (ex: 'A', 'B', 'Tous')
}

export interface SousProduitRecette {
  platId: string;
  quantite: number;
}

export interface Plat {
  id: string;
  nom: string;
  description?: string;
  prix: number;
  disponible: boolean;
  allergenes?: string[];
  categorie: string;
  dateCreation: string;
  stock?: number;
  imageUrl?: string;
  ordre?: number;
  formats?: number[]; // Formats de conditionnement (ex: [6, 12, 24] pour les packs)
  isPlat?: boolean; // true pour les plats cuisinés (pas de gestion de formats)
  sousProduitsIds?: SousProduitRecette[]; // Recette : ingrédients prélevés du stock à la vente
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

/* ---- CAISSE (POS) ---- */

export interface ClientCaisse {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  dateCreation: string;
}

export interface LigneCaisse {
  platId: string;
  platNom: string;
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
}

export type ModePaiement = 'immediat' | 'ardoise' | 'payconiq' | 'offert';

export interface TransactionCaisse {
  id: string;
  lignes: LigneCaisse[];
  total: number;
  modePaiement: ModePaiement;
  statut: 'payee' | 'ardoise' | 'annulee' | 'offert';
  clientType: 'membre' | 'externe' | 'anonyme' | 'club';
  clientId?: string;
  clientNom?: string;
  dateTransaction: string;
  operateur: string;
}

export interface CompteEquipe {
  id: string;
  nom: string; // Ex: "Équipe A", "Équipe B", "Équipe C", "Club - Événements"
  type: 'equipe' | 'club_general'; // Pour différencier équipes vs compte club général
  equipeLabel?: string; // Ex: "A", "B", "C" — pour l'affichage
  description?: string; // Ex: "Tournées après matchs équipe A"
}

export interface CompteCaisse {
  id: string;
  clientType: 'membre' | 'externe' | 'club';
  clientId: string;
  clientNom: string;
  solde: number;
  derniereActivite: string;
  description?: string; // Ex: "Tournées après matchs", "Réception sponsors"
  equipe?: string; // Ex: "A", "B", "C" — pour filtrer par équipe
  historique: {
    transactionId: string;
    montant: number;
    type: 'consommation' | 'paiement';
    date: string;
    modePaiement?: 'immediat' | 'payconiq'; // Type de paiement pour les paiements
    description?: string; // Ex: "Tournée semaine 12 vs Logis Auderghem"
  }[];
}

export interface CategorieCaisse {
  id: string;
  nom: string;
  ordre: number;
}

/* ---- SOLDE CAISSE ---- */

export interface TransactionSolde {
  id: string;
  type: 'vente_cash' | 'vente_payconiq' | 'compte_cash' | 'compte_payconiq';
  montant: number;
  date: string;
  transactionId?: string; // Référence à la transaction de caisse
  compteId?: string; // Référence au compte si c'est un paiement de compte
  compteName?: string; // Nom du client pour les paiements de compte
}

export interface SoldeCaisse {
  id: string;
  montantInitial: number;
  dateOuverture: string;
  dateCloture?: string;
  statut: 'en_cours' | 'cloture';
  transactions: TransactionSolde[];
}
