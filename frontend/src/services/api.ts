/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
export const fetchTestData = async () => {
  const response = await axios.get(`${API_URL}/test`);
  return response.data;
};

export const updateTestData = async (id: number, data: any) => {
  const response = await axios.put(`${API_URL}/test/${id}`, data);
  return response.data;
};

export const createTestData = async (data: any) => {
  const response = await axios.post(`${API_URL}/test`, data);
  return response.data;
};

export const deleteTestData = async (id: number) => {
  await axios.delete(`${API_URL}/test/${id}`);
};
