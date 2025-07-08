/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api.ts
import axios from 'axios';
import { Image } from '@/services/type.ts';

const API_URL = import.meta.env.VITE_API_URL;

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
    return updatedMatch ? { ...match, score: updatedMatch.score } : match;
  });
  return updateSaison(id, saison);
};

export const createSaison = async (data: any) => {
  const response = await axios.post(`${API_URL}/saisons`, data);
  return response.data;
};

export const deleteSaison = async (id: string) => {
  await axios.delete(`${API_URL}/saisons/${id}`);
};
