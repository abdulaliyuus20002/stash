import { create } from 'zustand';
import axios from 'axios';
import { Collection } from '../types';
import { API_URL } from '../utils/config';

interface CollectionsState {
  collections: Collection[];
  isLoading: boolean;
  fetchCollections: (token: string) => Promise<void>;
  addCollection: (token: string, name: string) => Promise<Collection>;
  updateCollection: (token: string, id: string, name: string) => Promise<void>;
  deleteCollection: (token: string, id: string) => Promise<void>;
}

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const useCollectionsStore = create<CollectionsState>((set) => ({
  collections: [],
  isLoading: false,

  fetchCollections: async (token: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/api/collections`, {
        headers: getHeaders(token),
      });
      set({ collections: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addCollection: async (token: string, name: string) => {
    const response = await axios.post(`${API_URL}/api/collections`, { name }, {
      headers: getHeaders(token),
    });
    const newCollection = response.data;
    set((state) => ({ collections: [...state.collections, newCollection] }));
    return newCollection;
  },

  updateCollection: async (token: string, id: string, name: string) => {
    const response = await axios.put(`${API_URL}/api/collections/${id}`, { name }, {
      headers: getHeaders(token),
    });
    set((state) => ({
      collections: state.collections.map((col) =>
        col.id === id ? response.data : col
      ),
    }));
  },

  deleteCollection: async (token: string, id: string) => {
    await axios.delete(`${API_URL}/api/collections/${id}`, {
      headers: getHeaders(token),
    });
    set((state) => ({
      collections: state.collections.filter((col) => col.id !== id),
    }));
  },
}));
