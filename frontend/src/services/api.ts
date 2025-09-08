/* eslint-disable */
// src/services/api.ts
import axios from 'axios';
import {
  Image,
  Commande,
  CommandeItem,
  Joueur,
  Match,
} from '@/services/type.ts';

const API_URL = import.meta.env.VITE_API_URL;

/* Utilisateurs (profil JSON Server) */

export const fetchUsers = async () => {
  const response = await axios.get(`${API_URL}/membres`);
  return response.data;
};

export const createUserProfile = async (data: any) => {
  const response = await axios.post(`${API_URL}/membres`, data);
  return response.data;
};

export const updateUserProfile = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/membres/${id}`, data);
  return response.data;
};

export const deleteUserProfile = async (id: string) => {
  await axios.delete(`${API_URL}/membres/${id}`);
};

/* Abscence Calendar/Training Calendar/Food menu - Compatibilité */

export const fetchAbsence = async () => {
  const response = await axios.get(`${API_URL}/absences`);
  return response.data;
};

export const updateAbsence = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/absences/${id}`, data);
  return response.data;
};

export const createAbsence = async (data: any) => {
  const response = await axios.post(`${API_URL}/absences`, data);
  return response.data;
};

export const deleteAbsence = async (id: string) => {
  await axios.delete(`${API_URL}/absences/${id}`);
};

export const fetchTraining = async () => {
  const response = await axios.get(`${API_URL}/training`);
  return response.data;
};

export const updateTraining = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/training/${id}`, data);
  return response.data;
};

export const createTraining = async (data: any) => {
  const response = await axios.post(`${API_URL}/training`, data);
  return response.data;
};

export const deleteTraining = async (id: string) => {
  await axios.delete(`${API_URL}/training/${id}`);
};

// Garder la compatibilité avec l'ancien système de menu
export const fetchFoodMenu = async () => {
  // Essayer d'abord le nouveau système (zones de commande)
  try {
    const zones = await fetchZonesCommande();
    // Convertir les zones en format de menu legacy pour compatibilité
    return zones.map((zone: any) => ({
      id: zone.id,
      date: zone.date,
      dateLimiteCommande: zone.dateLimiteCommande,
      statut: zone.statut,
      commandes: zone.commandes,
    }));
  } catch (error) {
    // Fallback vers l'ancien système
    const response = await axios.get(`${API_URL}/menu`);
    return response.data;
  }
};

export const updateFoodMenu = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/menu/${id}`, data);
  return response.data;
};
export const createFoodMenu = async (data: any) => {
  const response = await axios.post(`${API_URL}/menu`, data);
  return response.data;
};
export const deleteFoodMenu = async (id: string) => {
  await axios.delete(`${API_URL}/menu/${id}`);
};


/* Zones de Commande API Endpoints */
export const fetchZonesCommande = async () => {
  const response = await axios.get(`${API_URL}/zonesCommande`);
  return response.data;
};

export const createZoneCommande = async (data: any) => {
  const response = await axios.post(`${API_URL}/zonesCommande`, data);
  return response.data;
};

export const updateZoneCommande = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/zonesCommande/${id}`, data);
  return response.data;
};

export const deleteZoneCommande = async (id: string) => {
  await axios.delete(`${API_URL}/zonesCommande/${id}`);
};


/* Actualités API Endpoints */

export const fetchActualites = async () => {
  const response = await axios.get(`${API_URL}/actualite`);
  return response.data;
};

export const updateActualite = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/actualite/${id}`, data);
  return response.data;
};

export const createActualite = async (data: any) => {
  const response = await axios.post(`${API_URL}/actualite`, data);
  return response.data;
};

export const deleteActualite = async (id: string) => {
  await axios.delete(`${API_URL}/actualite/${id}`);
};

/* Images API Endpoints */

export async function fetchImages(): Promise<Image[]> {
  const res = await fetch(`${API_URL}/images`);
  return res.json();
}

export async function createImage(data: {
  label: string;
  url: string;
  type?: string;
  folder?: string;
}): Promise<void> {
  await fetch(`${API_URL}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateImage(
  id: string,
  data: { label?: string; url?: string; folder?: string; type?: string }
): Promise<void> {
  // D'abord récupérer l'image existante
  const currentImageResponse = await fetch(`${API_URL}/images/${id}`);
  const currentImage = await currentImageResponse.json();

  // Fusionner les nouvelles données avec les données existantes
  const updatedImage = { ...currentImage, ...data };

  await fetch(`${API_URL}/images/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedImage),
  });
}

export async function deleteImage(id: string): Promise<void> {
  await fetch(`${API_URL}/images/${id}`, {
    method: 'DELETE',
  });
}

/* Sponsors API Endpoints */

export const fetchSponsors = async () => {
  const response = await axios.get(`${API_URL}/sponsors`);
  return response.data;
};

export const updateSponsor = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/sponsors/${id}`, data);
  return response.data;
};

export const createSponsor = async (data: any) => {
  const response = await axios.post(`${API_URL}/sponsors`, data);
  return response.data;
};

export const deleteSponsor = async (id: string) => {
  await axios.delete(`${API_URL}/sponsors/${id}`);
};

/* Saisons API Endpoints */

export const fetchSaisons = async () => {
  const response = await axios.get(`${API_URL}/saisons`);
  return response.data;
};

export const fetchSaisonById = async (id: string) => {
  const response = await axios.get(`${API_URL}/saisons/${id}`);
  return response.data;
};

export const fetchSaisonEnCours = async () => {
  const response = await axios.get(`${API_URL}/saisons?statut=En%20cours`);
  return response.data[0] || null; // Retourne la première saison en cours ou null
};

export const updateSaison = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/saisons/${id}`, data);
  return response.data;
};

export const updateSaisonCalendrier = async (id: string, calendrier: any[]) => {
  const saison = await fetchSaisonById(id);
  saison.calendrier = calendrier;
  return updateSaison(id, saison);
};

export const updateSaisonResults = async (
  id: string,
  matchesWithScores: any[]
) => {
  const saison = await fetchSaisonById(id);

  // Helper function pour s'assurer que tous les joueurs ont un champ wo
  const ensureWoField = (joueurs: Joueur[] | undefined): Joueur[] => {
    if (!joueurs) return [];
    return joueurs.map((j) => ({
      ...j,
      wo: j.wo || 'n', // S'assurer que wo est "y" ou "n"
    }));
  };

  saison.calendrier = saison.calendrier.map((match: Match) => {
    const updatedMatch = matchesWithScores.find((m) => m.id === match.id);
    if (!updatedMatch) return match;

    return {
      ...match,
      // Mettre à jour le score (même s'il est vide)
      score: updatedMatch.score,
      // Mettre à jour les scores individuels (créer l'objet si nécessaire)
      scoresIndividuels:
        updatedMatch.scoresIndividuels || match.scoresIndividuels || {},
      // Mettre à jour les joueurs avec champ wo assuré
      joueur_dom: ensureWoField(
        updatedMatch.joueursDomicile ||
          updatedMatch.joueur_dom ||
          match.joueur_dom
      ),
      joueur_ext: ensureWoField(
        updatedMatch.joueursExterieur ||
          updatedMatch.joueur_ext ||
          match.joueur_ext
      ),
      // Conserver la compatibilité avec les nouveaux champs
      joueursDomicile: ensureWoField(
        updatedMatch.joueursDomicile ||
          updatedMatch.joueur_dom ||
          match.joueursDomicile
      ),
      joueursExterieur: ensureWoField(
        updatedMatch.joueursExterieur ||
          updatedMatch.joueur_ext ||
          match.joueursExterieur
      ),
    };
  });
  return updateSaison(id, saison);
};

/* Joueurs par équipe et semaine API Endpoint */

/**
 * Récupère les joueurs d'une équipe pour une semaine spécifique
 * @param saisonId ID de la saison
 * @param serieId ID de la série
 * @param semaine Numéro de la semaine
 * @param equipe Nom de l'équipe (utilisé pour filtrer)
 * @returns Les joueurs ayant participé aux matchs de cette équipe
 */
export const fetchJoueursBySemaineAndEquipe = async (
  saisonId: string,
  serieId: string,
  semaine: number,
  equipe: string
): Promise<Joueur[]> => {
  // Récupérer la saison complète
  const saison = await fetchSaisonById(saisonId);

  // Filtrer les matchs par série et semaine
  const matchs = saison.calendrier.filter(
    (match: Match) => match.serieId === serieId && match.semaine === semaine
  );

  // Récupérer tous les joueurs des matchs où l'équipe joue
  const joueurs: Joueur[] = [];

  matchs.forEach((match: Match) => {
    if (match.domicile === equipe && match.joueursDomicile) {
      joueurs.push(...match.joueursDomicile);
    } else if (match.exterieur === equipe && match.joueursExterieur) {
      joueurs.push(...match.joueursExterieur);
    } else if (match.domicile === equipe && match.joueur_dom) {
      joueurs.push(...match.joueur_dom);
    } else if (match.exterieur === equipe && match.joueur_ext) {
      joueurs.push(...match.joueur_ext);
    }
  });

  // Éliminer les doublons par ID
  return [...new Map(joueurs.map((j) => [j.id, j])).values()];
};

export const createSaison = async (data: any) => {
  const response = await axios.post(`${API_URL}/saisons`, data);
  return response.data;
};

export const deleteSaison = async (id: string) => {
  await axios.delete(`${API_URL}/saisons/${id}`);
};

/* Commandes API Endpoints */

export const fetchCommandes = async (): Promise<Commande[]> => {
  const response = await axios.get(`${API_URL}/commandes`);
  return response.data;
};

export const fetchCommandeByMembre = async (
  memberId: string
): Promise<Commande | null> => {
  const response = await axios.get(`${API_URL}/commandes`);
  const commandes: Commande[] = response.data;

  // Trouver une commande qui contient des items de ce membre
  const commandeWithMemberItems = commandes.find((commande) =>
    commande.members.some((member) =>
      member.items.some((item) => item.id === memberId)
    )
  );

  return commandeWithMemberItems || null;
};

export const createCommande = async (
  data: Omit<Commande, 'id'>
): Promise<Commande> => {
  const response = await axios.post(`${API_URL}/commandes`, data);
  return response.data;
};

export const updateCommande = async (
  id: string,
  data: Partial<Omit<Commande, 'id'>>
): Promise<Commande> => {
  const response = await axios.put(`${API_URL}/commandes/${id}`, data);
  return response.data;
};

export const addItemToCommande = async (
  commandeId: string,
  item: Omit<CommandeItem, 'id'> & { memberId: string }
): Promise<Commande> => {
  // Récupérer la commande existante
  const response = await axios.get(`${API_URL}/commandes/${commandeId}`);
  const commande: Commande = response.data;

  // Ajouter le nouvel item avec un ID généré
  const newItem: CommandeItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    category: item.category,
    epaisseur: item.epaisseur,
    fournisseur: item.fournisseur,
  };

  // Trouver ou créer le membre dans la commande
  let memberGroup = commande.members.find(m => m.memberId === item.memberId);

  if (!memberGroup) {
    memberGroup = {
      memberId: item.memberId,
      items: [],
      subtotal: '0'
    };
    commande.members.push(memberGroup);
  }

  // Ajouter l'item au membre
  memberGroup.items.push(newItem);

  // Recalculer le sous-total du membre
  const memberSubtotal = memberGroup.items.reduce(
    (sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)),
    0
  );
  memberGroup.subtotal = memberSubtotal.toString();

  // Recalculer le total global
  const newTotal = commande.members.reduce(
    (sum, member) => sum + parseFloat(member.subtotal),
    0
  );
  commande.total = newTotal.toString();

  // Mettre à jour la commande
  return updateCommande(commandeId, commande);
};

// Fonction pour obtenir ou créer une commande ouverte
export const getOrCreateOpenCommande = async (): Promise<Commande> => {
  const commandes = await fetchCommandes();

  // Chercher une commande ouverte existante
  let openCommande = commandes.find(c => c.statut === 'open');

  if (!openCommande) {
    // Créer une nouvelle commande ouverte
    const newCommande = {
      name: `Commande Groupée ${new Date().getFullYear()}`,
      date: new Date().toISOString().split('T')[0],
      members: [],
      total: '0',
      statut: 'open' as const,
    };

    openCommande = await createCommande(newCommande);
  }

  return openCommande;
};

// Fonction pour modifier un item de commande
export const updateCommandeItem = async (
  itemId: string,
  updates: {
    name?: string;
    price?: string;
    quantity?: string;
    epaisseur?: string;
    couleur?: string;
    fournisseur?: string;
    type?: string;
    description?: string;
  }
): Promise<CommandeItem> => {
  // Trouver la commande qui contient cet item
  const commandes = await fetchCommandes();
  const commande = commandes.find(c =>
    c.members.some(member =>
      member.items.some(item => item.id === itemId)
    )
  );

  if (!commande) {
    throw new Error('Commande non trouvée pour cet item');
  }

  // Trouver le membre qui contient l'item
  const memberGroup = commande.members.find(member =>
    member.items.some(item => item.id === itemId)
  );

  if (!memberGroup) {
    throw new Error('Membre non trouvé pour cet item');
  }

  // Mettre à jour l'item
  memberGroup.items = memberGroup.items.map(item => {
    if (item.id === itemId) {
      return { ...item, ...updates };
    }
    return item;
  });

  // Recalculer le sous-total du membre
  const memberSubtotal = memberGroup.items.reduce(
    (sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)),
    0
  );
  memberGroup.subtotal = memberSubtotal.toString();

  // Recalculer le total global
  const newTotal = commande.members.reduce(
    (sum, member) => sum + parseFloat(member.subtotal),
    0
  );
  commande.total = newTotal.toString();

  await updateCommande(commande.id, commande);

  // Retourner l'item modifié
  return memberGroup.items.find(item => item.id === itemId)!;
};

// Fonction pour supprimer un item de commande
export const deleteCommandeItem = async (itemId: string): Promise<void> => {
  // Trouver la commande qui contient cet item
  const commandes = await fetchCommandes();
  const commande = commandes.find(c =>
    c.members.some(member =>
      member.items.some(item => item.id === itemId)
    )
  );

  if (!commande) {
    throw new Error('Commande non trouvée pour cet item');
  }

  // Trouver le membre qui contient l'item
  const memberGroup = commande.members.find(member =>
    member.items.some(item => item.id === itemId)
  );

  if (!memberGroup) {
    throw new Error('Membre non trouvé pour cet item');
  }

  // Supprimer l'item
  memberGroup.items = memberGroup.items.filter(item => item.id !== itemId);

  // Recalculer le sous-total du membre
  const memberSubtotal = memberGroup.items.reduce(
    (sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)),
    0
  );
  memberGroup.subtotal = memberSubtotal.toString();

  // Si le membre n'a plus d'items, le supprimer
  if (memberGroup.items.length === 0) {
    commande.members = commande.members.filter(m => m.memberId !== memberGroup.memberId);
  }

  // Recalculer le total global
  const newTotal = commande.members.reduce(
    (sum, member) => sum + parseFloat(member.subtotal),
    0
  );
  commande.total = newTotal.toString();

  await updateCommande(commande.id, commande);
};

// Fonction pour supprimer une commande
export const deleteCommande = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/commandes/${id}`);
};

/* Sauvegarde des sélections/compositions */
// Cette fonction est maintenant obsolète, utiliser updateSaisonResults à la place
/*
export const saveSelections = async (
  saisonId: string,
  serieId: string,
  semaine: number,
  selections: Record<string, string[]>
) => {
  // Code supprimé - utiliser updateSaisonResults
};
*/

// ---- INFOS GENERALES ----

// Récupérer toutes les informations (inclut contact, about, footer, palmares)
export const fetchInformations = async () => {
  const response = await axios.get(`${API_URL}/informations`);
  return response.data;
};

// Mettre à jour toutes les informations (objet complet)
export const updateInformations = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/informations/${id}`, data);
  return response.data;
};

// ---- CONTACT ----

// --- Récupérer uniquement la section contact ---
export const fetchContact = async () => {
  const allInfos = await fetchInformations();
  const current = allInfos[0]; // supposer qu'il n'y a qu'un objet "informations"
  return current.contact ?? [];
};

// --- Mettre à jour la section contact ---
export const updateContact = async (newContactData: any[]) => {
  const allInfos = await fetchInformations();
  const current = allInfos[0]; // l'objet "informations" complet
  const updated = { ...current, contact: newContactData };

  const response = await axios.put(
    `${API_URL}/informations/${current.id}`,
    updated
  );
  return response.data;
};

// ---- ABOUT ----
export const fetchAbout = async () => {
  const response = await axios.get(`${API_URL}/informations`);
  return response.data[0].about;
};

export const updateAbout = async (data: any) => {
  const allInfos = await fetchInformations();
  const current = allInfos[0];
  const updated = { ...current, about: data };

  const response = await axios.put(
    `${API_URL}/informations/${current.id}`,
    updated
  );
  return response.data;
};

// ---- PALMARES ----
export const fetchPalmares = async () => {
  const response = await axios.get(`${API_URL}/informations`);
  return response.data[0].palmares;
};

export const updatePalmares = async (data: any) => {
  const allInfos = await fetchInformations();
  const current = allInfos[0];
  const updated = { ...current, palmares: data };

  const response = await axios.put(
    `${API_URL}/informations/${current.id}`,
    updated
  );
  return response.data;
};

// ---- EVENT ----

export const fetchEvents = async () => {
  const response = await axios.get(`${API_URL}/event`);
  return response.data;
};

export const updateEvent = async (data: any) => {
  // Correction : PUT directement sur /event au lieu de /event/{id}
  const response = await axios.put(`${API_URL}/event`, data);
  return response.data;
};

// Fonction pour créer une nouvelle commande depuis l'admin
export const createNewCommande = async (
  data: Pick<Commande, 'name' | 'date' | 'dateFin'>
): Promise<Commande> => {
  const newCommande = {
    ...data,
    members: [],
    total: '0',
    statut: 'open' as const,
  };

  const response = await axios.post(`${API_URL}/commandes`, newCommande);
  return response.data;
};

// Fonction pour modifier les informations de base d'une commande
export const updateCommandeInfo = async (
  id: string,
  updates: Pick<Commande, 'name' | 'date' | 'dateFin'>
): Promise<Commande> => {
  // Récupérer la commande existante
  const response = await axios.get(`${API_URL}/commandes/${id}`);
  const commande: Commande = response.data;

  // Mettre à jour seulement les champs fournis
  const updatedCommande = {
    ...commande,
    ...updates
  };

  return updateCommande(id, updatedCommande);
};

/* Facebook API Endpoints */

export const publishToFacebook = async (data: {
  message: string;
  trainingId?: string;
  type: 'training' | 'news' | 'event';
}) => {
  const response = await axios.post(`${API_URL}/facebook/publish`, data);
  return response.data;
};

export const getFacebookConfig = async () => {
  const response = await axios.get(`${API_URL}/facebook/config`);
  return response.data;
};

export const updateFacebookConfig = async (data: {
  accessToken?: string;
  pageId?: string;
  appId?: string;
  enabled: boolean;
}) => {
  const response = await axios.put(`${API_URL}/facebook/config`, data);
  return response.data;
};



