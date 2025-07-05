/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface Image {
  id: string;
  label: string;
  url: string;
}

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
