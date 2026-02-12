/* eslint-disable */
// src/services/api.ts
import axios from 'axios';
import {
  Image,
  Commande,
  CommandeItem,
  Joueur,
  Match,
  InfosPersonnalisees,
  Saison,
  ClientCaisse,
  TransactionCaisse,
  CompteCaisse,
  CategorieCaisse,
  Plat,
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

// Fonction pour mettre à jour la dernière connexion d'un membre
export const updateMemberLastLog = async (supabaseUid: string) => {
  try {
    const membres = await fetchUsers();
    const membre = membres.find((m: any) => m.supabase_uid === supabaseUid);

    if (membre) {
      const response = await axios.patch(`${API_URL}/membres/${membre.id}`, {
        lastLog: new Date().toISOString()
      });
      return response.data;
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du lastLog:', error);
  }
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
  const saison = response.data[0] || null;
  // Auto-créer une saison minimale si aucune n'existe
  if (!saison) {
    const now = new Date();
    const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; // saison sportive (août -> juillet)
    const saisonLabel = `Saison ${y}-${y + 1}`;
    const creation = await axios.post(`${API_URL}/saisons`, {
      label: saisonLabel,
      statut: 'En cours',
      equipesClub: [],
      series: [],
      calendrier: [],
      clubs: [],
      infosPersonnalisees: [],
    });
    return creation.data;
  }
  return saison;
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
      wo: j.wo || 'n',
    }));
  };

  const originalCalendar: Match[] = Array.isArray(saison.calendrier) ? saison.calendrier : [];
  const originalIds = new Set(originalCalendar.map((m) => m.id));

  // Mise à jour des matchs existants
  const updatedCalendar = originalCalendar.map((match: Match) => {
    const updatedMatch = matchesWithScores.find((m) => m.id === match.id);
    if (!updatedMatch) return match;

    // Normaliser joueurs et champs wo
    const joueur_dom = ensureWoField(
      updatedMatch.joueursDomicile || updatedMatch.joueur_dom || match.joueur_dom
    );
    const joueur_ext = ensureWoField(
      updatedMatch.joueursExterieur || updatedMatch.joueur_ext || match.joueur_ext
    );

    return {
      ...match,
      score: updatedMatch.score ?? match.score ?? '',
      scoresIndividuels: updatedMatch.scoresIndividuels || match.scoresIndividuels || {},
      joueursDomicile: joueur_dom,
      joueursExterieur: joueur_ext,
      joueur_dom,
      joueur_ext,
    } as Match;
  });

  // Ajout des nouveaux matchs (upsert) venant de TABT qui n'existent pas encore dans la saison
  const newMatches: Match[] = matchesWithScores
    .filter((m) => !originalIds.has(m.id))
    .map((m) => {
      const joueur_dom = ensureWoField(m.joueursDomicile || m.joueur_dom);
      const joueur_ext = ensureWoField(m.joueursExterieur || m.joueur_ext);
      return {
        id: m.id,
        saisonId: m.saisonId || saison.id,
        serieId: m.serieId || '',
        semaine: m.semaine || 0,
        domicile: m.domicile || m.homeTeam || '',
        exterieur: m.exterieur || m.awayTeam || '',
        score: m.score || '',
        date: m.date || '',
        heure: m.heure,
        lieu: m.lieu,
        joueursDomicile: joueur_dom,
        joueursExterieur: joueur_ext,
        joueur_dom,
        joueur_ext,
        scoresIndividuels: m.scoresIndividuels || {},
      } as Match;
    });

  saison.calendrier = [...updatedCalendar, ...newMatches];
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

/* Menu/Plats API Endpoints */
export const fetchPlats = async () => {
  const response = await axios.get(`${API_URL}/menu`);
  return response.data;
};

export const createPlat = async (data: any) => {
  const response = await axios.post(`${API_URL}/menu`, data);
  return response.data;
};

export const updatePlat = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/menu/${id}`, data);
  return response.data;
};

export const deletePlat = async (id: string) => {
  await axios.delete(`${API_URL}/menu/${id}`);
};

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

/* Logging API Endpoints */

export const createLog = async (data: {
  action: string;
  details?: string;
  userId?: string;
  userName?: string;
  userAgent?: string;
  timestamp?: string;
}) => {
  const logEntry = {
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
    userAgent: data.userAgent || navigator.userAgent,
  };

  const response = await axios.post(`${API_URL}/logs`, logEntry);
  return response.data;
};

export const logSelectionsAccess = async (userId?: string, userName?: string) => {
  return createLog({
    action: 'selections_access',
    details: `Utilisateur ${userName || 'anonyme'} a ouvert la page Toutes les sélections du club`,
    userId,
    userName,
  });
};

export const logAccordionOpen = async (equipe: string, userId?: string, userName?: string) => {
  return createLog({
    action: 'accordion_open',
    details: `${userName || 'Utilisateur anonyme'} a ouvert l'accordéon pour l'équipe: ${equipe}`,
    userId,
    userName,
  });
};

// ---- Infos Exceptionnelles (helpers) ----
export const upsertInfosPersonnalisees = async (
  saisonId: string,
  payload: Omit<InfosPersonnalisees, 'id' | 'dateCreation' | 'dateModification'> & { id?: string }
): Promise<Saison> => {
  const saison = await fetchSaisonById(saisonId);
  const list: InfosPersonnalisees[] = Array.isArray(saison.infosPersonnalisees)
    ? saison.infosPersonnalisees
    : [];

  const nowIso = new Date().toISOString();
  const idx = list.findIndex((i) => i.matchId === payload.matchId);

  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      ...payload,
      dateModification: nowIso,
    };
  } else {
    list.push({
      id: `ip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...payload,
      dateCreation: nowIso,
      dateModification: nowIso,
    } as InfosPersonnalisees);
  }

  saison.infosPersonnalisees = list;
  return updateSaison(saisonId, saison);
};

export const deleteInfosPersonnalisees = async (
  saisonId: string,
  matchId: string
): Promise<Saison> => {
  const saison = await fetchSaisonById(saisonId);
  const list: InfosPersonnalisees[] = Array.isArray(saison.infosPersonnalisees)
    ? saison.infosPersonnalisees
    : [];
  saison.infosPersonnalisees = list.filter((i) => i.matchId !== matchId);
  return updateSaison(saisonId, saison);
};

/* ---- CAISSE: Clients Externes ---- */

export const fetchClientsCaisse = async (): Promise<ClientCaisse[]> => {
  const response = await axios.get(`${API_URL}/clientsCaisse`);
  return response.data;
};

export const createClientCaisse = async (
  data: Omit<ClientCaisse, 'id' | 'dateCreation'>
): Promise<ClientCaisse> => {
  const response = await axios.post(`${API_URL}/clientsCaisse`, {
    ...data,
    dateCreation: new Date().toISOString(),
  });
  return response.data;
};

export const updateClientCaisse = async (
  id: string,
  data: Partial<ClientCaisse>
): Promise<ClientCaisse> => {
  const response = await axios.patch(`${API_URL}/clientsCaisse/${id}`, data);
  return response.data;
};

export const deleteClientCaisse = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/clientsCaisse/${id}`);
};

/* ---- CAISSE: Transactions ---- */

export const fetchTransactionsCaisse = async (): Promise<TransactionCaisse[]> => {
  const response = await axios.get(`${API_URL}/transactionsCaisse`);
  return response.data;
};

export const createTransactionCaisse = async (
  data: Omit<TransactionCaisse, 'id'>
): Promise<TransactionCaisse> => {
  const response = await axios.post(`${API_URL}/transactionsCaisse`, data);
  return response.data;
};

export const fetchTransactionsByClient = async (
  clientId: string
): Promise<TransactionCaisse[]> => {
  const response = await axios.get(
    `${API_URL}/transactionsCaisse?clientId=${clientId}`
  );
  return response.data;
};

export const updateTransactionCaisse = async (
  id: string,
  data: Partial<TransactionCaisse>
): Promise<TransactionCaisse> => {
  const response = await axios.patch(
    `${API_URL}/transactionsCaisse/${id}`,
    data
  );
  return response.data;
};

export const incrementStock = async (
  platId: string,
  quantite: number
): Promise<Plat> => {
  const response = await axios.get(`${API_URL}/menu/${platId}`);
  const plat: Plat = response.data;
  if (plat.stock !== undefined) {
    const newStock = plat.stock + quantite;
    return updatePlatStock(platId, newStock);
  }
  return plat;
};

/* ---- CAISSE: Comptes (Ardoise) ---- */

export const fetchComptesCaisse = async (): Promise<CompteCaisse[]> => {
  const response = await axios.get(`${API_URL}/comptesCaisse`);
  return response.data;
};

export const fetchCompteCaisseByClient = async (
  clientId: string
): Promise<CompteCaisse | null> => {
  const response = await axios.get(
    `${API_URL}/comptesCaisse?clientId=${clientId}`
  );
  return response.data[0] || null;
};

export const createCompteCaisse = async (
  data: Omit<CompteCaisse, 'id'>
): Promise<CompteCaisse> => {
  const response = await axios.post(`${API_URL}/comptesCaisse`, data);
  return response.data;
};

export const updateCompteCaisse = async (
  id: string,
  data: CompteCaisse
): Promise<CompteCaisse> => {
  const response = await axios.put(`${API_URL}/comptesCaisse/${id}`, data);
  return response.data;
};

/* ---- CAISSE: Stock ---- */

export const updatePlatStock = async (
  id: string,
  stock: number
): Promise<Plat> => {
  const response = await axios.patch(`${API_URL}/menu/${id}`, { stock });
  return response.data;
};

export const decrementStock = async (
  platId: string,
  quantite: number
): Promise<Plat> => {
  const response = await axios.get(`${API_URL}/menu/${platId}`);
  const plat: Plat = response.data;
  if (plat.stock !== undefined) {
    const newStock = Math.max(0, plat.stock - quantite);
    return updatePlatStock(platId, newStock);
  }
  return plat;
};

/* ---- CAISSE: Categories ---- */

export const fetchCategoriesCaisse = async (): Promise<CategorieCaisse[]> => {
  const response = await axios.get(`${API_URL}/categoriesCaisse`);
  return response.data;
};

export const createCategorieCaisse = async (
  data: Omit<CategorieCaisse, 'id'>
): Promise<CategorieCaisse> => {
  const response = await axios.post(`${API_URL}/categoriesCaisse`, data);
  return response.data;
};

export const updateCategorieCaisse = async (
  id: string,
  data: Partial<CategorieCaisse>
): Promise<CategorieCaisse> => {
  const response = await axios.patch(`${API_URL}/categoriesCaisse/${id}`, data);
  return response.data;
};

export const deleteCategorieCaisse = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/categoriesCaisse/${id}`);
};

/* ---- CAISSE: Bulk Reorder ---- */

export const reorderCategoriesCaisse = async (
  orderedIds: { id: string; ordre: number }[]
): Promise<void> => {
  await Promise.all(
    orderedIds.map(({ id, ordre }) =>
      axios.patch(`${API_URL}/categoriesCaisse/${id}`, { ordre })
    )
  );
};

export const reorderPlatsCaisse = async (
  orderedItems: { id: string; ordre: number }[]
): Promise<void> => {
  await Promise.all(
    orderedItems.map(({ id, ordre }) =>
      axios.patch(`${API_URL}/menu/${id}`, { ordre })
    )
  );
};

/* ---- CAISSE: Images Cloudinary (dossier Caisse) ---- */

export const fetchImagesCaisse = async (): Promise<Image[]> => {
  const allImages = await fetchImages();
  return allImages.filter((img) => img.folder === 'Caisse');
};
