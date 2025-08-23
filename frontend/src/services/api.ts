/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api.ts
import axios from 'axios';
import { Image, Commande, Joueur, Match } from '@/services/type.ts';

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
      // Mettre à jour les joueurs
      joueur_dom:
        updatedMatch.joueursDomicile ||
        updatedMatch.joueur_dom ||
        match.joueur_dom ||
        [],
      joueur_ext:
        updatedMatch.joueursExterieur ||
        updatedMatch.joueur_ext ||
        match.joueur_ext ||
        [],
      // Conserver la compatibilité avec les nouveaux champs
      joueursDomicile:
        updatedMatch.joueursDomicile ||
        updatedMatch.joueur_dom ||
        match.joueursDomicile ||
        [],
      joueursExterieur:
        updatedMatch.joueursExterieur ||
        updatedMatch.joueur_ext ||
        match.joueursExterieur ||
        [],
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

export const fetchSelectionByMembre = async (
  membre: string
): Promise<Commande | null> => {
  const response = await axios.get(
    `${API_URL}/commande?membre=${encodeURIComponent(membre)}`
  );
  return response.data[0] || null;
};

export const createSelection = async (
  data: Omit<Commande, 'id'>
): Promise<Commande> => {
  const response = await axios.post(`${API_URL}/commande`, data);
  return response.data;
};

export const updateSelection = async (
  id: string,
  data: Partial<Omit<Commande, 'id'>>
): Promise<Commande> => {
  const response = await axios.put(`${API_URL}/commande/${id}`, data);
  return response.data;
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
