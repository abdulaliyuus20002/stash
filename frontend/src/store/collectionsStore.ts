import { create } from 'zustand';
import { Collection } from '../types';
import api from '../utils/api';

interface CollectionsState {
  collections: Collection[];
  isLoading: boolean;
  fetchCollections: () => Promise<void>;
  addCollection: (name: string) => Promise<Collection>;
  updateCollection: (id: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>((set) => ({
  collections: [],
  isLoading: false,

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/collections');
      set({ collections: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addCollection: async (name: string) => {
    const response = await api.post('/collections', { name });
    const newCollection = response.data;
    set((state) => ({ collections: [...state.collections, newCollection] }));
    return newCollection;
  },

  updateCollection: async (id: string, name: string) => {
    const response = await api.put(`/collections/${id}`, { name });
    set((state) => ({
      collections: state.collections.map((col) =>
        col.id === id ? response.data : col
      ),
    }));
  },

  deleteCollection: async (id: string) => {
    await api.delete(`/collections/${id}`);
    set((state) => ({
      collections: state.collections.filter((col) => col.id !== id),
    }));
  },
}));
