/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
export const fetchTestData = async () => {
  const response = await axios.get(`${API_URL}/actualite`);
  return response.data;
};

export const updateTestData = async (id: number, data: any) => {
  const response = await axios.put(`${API_URL}/actualite/${id}`, data);
  return response.data;
};

export const createTestData = async (data: any) => {
  const response = await axios.post(`${API_URL}/actualite`, data);
  return response.data;
};

export const deleteTestData = async (id: number) => {
  await axios.delete(`${API_URL}/actualite/${id}`);
};
