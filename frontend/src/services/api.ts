/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api.ts
import axios from 'axios';
import { Image, Commande, Joueur, Match } from '@/services/type.ts';

const API_URL = import.meta.env.VITE_API_URL;

/* membres API Endpoints */

// Fonction pour récupérer les membres (protégée)
export const fetchMembres = async () => {
  const response = await axios.get(`${API_URL}/membres`);
  return response.data;
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
}): Promise<void> {
  await fetch(`${API_URL}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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
  saison.calendrier = saison.calendrier.map((match: { id: any }) => {
    const updatedMatch = matchesWithScores.find((m) => m.id === match.id);
    if (!updatedMatch) return match;

    return {
      ...match,
      score: updatedMatch.score,
      joueur_dom: updatedMatch.joueursDomicile || updatedMatch.joueur_dom || [],
      joueur_ext:
        updatedMatch.joueursExterieur || updatedMatch.joueur_ext || [],
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
