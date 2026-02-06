import { create } from 'zustand';
import axios from 'axios';
import { SavedItem, MetadataResponse } from '../types';
import { API_URL } from '../utils/config';
import { useAuthStore } from './authStore';

interface ItemsState {
  items: SavedItem[];
  isLoading: boolean;
  sortOrder: 'newest' | 'oldest';
  platformFilter: string | null;
  fetchItems: (collectionId?: string, tag?: string) => Promise<void>;
  addItem: (url: string, data?: Partial<SavedItem>) => Promise<SavedItem>;
  updateItem: (id: string, data: Partial<SavedItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  extractMetadata: (url: string) => Promise<MetadataResponse>;
  setSortOrder: (order: 'newest' | 'oldest') => void;
  setPlatformFilter: (platform: string | null) => void;
  searchItems: (query: string) => Promise<SavedItem[]>;
}

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  isLoading: false,
  sortOrder: 'newest',
  platformFilter: null,

  fetchItems: async (collectionId?: string, tag?: string) => {
    set({ isLoading: true });
    try {
      const { sortOrder, platformFilter } = get();
      const params = new URLSearchParams();
      params.append('sort', sortOrder);
      if (platformFilter) params.append('platform', platformFilter);
      if (collectionId) params.append('collection', collectionId);
      if (tag) params.append('tag', tag);

      const response = await axios.get(`${API_URL}/api/items?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      set({ items: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addItem: async (url: string, data?: Partial<SavedItem>) => {
    try {
      const response = await axios.post(`${API_URL}/api/items`, { url, ...data }, {
        headers: getAuthHeaders(),
      });
      const newItem = response.data;
      set((state) => ({ items: [newItem, ...state.items] }));
      return newItem;
    } catch (error) {
      throw error;
    }
  },

  updateItem: async (id: string, data: Partial<SavedItem>) => {
    try {
      const response = await axios.put(`${API_URL}/api/items/${id}`, data, {
        headers: getAuthHeaders(),
      });
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? response.data : item
        ),
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteItem: async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/items/${id}`, {
        headers: getAuthHeaders(),
      });
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },

  extractMetadata: async (url: string) => {
    const response = await axios.post(`${API_URL}/api/extract-metadata`, { url }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  setSortOrder: (order) => set({ sortOrder: order }),
  setPlatformFilter: (platform) => set({ platformFilter: platform }),

  searchItems: async (query: string) => {
    if (!query || query.length < 2) return [];
    const response = await axios.get(`${API_URL}/api/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
}));
