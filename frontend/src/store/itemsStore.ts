import { create } from 'zustand';
import axios from 'axios';
import { SavedItem, MetadataResponse } from '../types';
import { API_URL } from '../utils/config';

interface ItemsState {
  items: SavedItem[];
  isLoading: boolean;
  sortOrder: 'newest' | 'oldest';
  platformFilter: string | null;
  fetchItems: (token: string, collectionId?: string, tag?: string) => Promise<void>;
  addItem: (token: string, url: string, data?: Partial<SavedItem>) => Promise<SavedItem>;
  updateItem: (token: string, id: string, data: Partial<SavedItem>) => Promise<void>;
  deleteItem: (token: string, id: string) => Promise<void>;
  extractMetadata: (token: string, url: string) => Promise<MetadataResponse>;
  setSortOrder: (order: 'newest' | 'oldest') => void;
  setPlatformFilter: (platform: string | null) => void;
  searchItems: (token: string, query: string) => Promise<SavedItem[]>;
}

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  isLoading: false,
  sortOrder: 'newest',
  platformFilter: null,

  fetchItems: async (token: string, collectionId?: string, tag?: string) => {
    set({ isLoading: true });
    try {
      const { sortOrder, platformFilter } = get();
      const params = new URLSearchParams();
      params.append('sort', sortOrder);
      if (platformFilter) params.append('platform', platformFilter);
      if (collectionId) params.append('collection', collectionId);
      if (tag) params.append('tag', tag);

      const response = await axios.get(`${API_URL}/api/items?${params.toString()}`, {
        headers: getHeaders(token),
      });
      set({ items: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addItem: async (token: string, url: string, data?: Partial<SavedItem>) => {
    try {
      const response = await axios.post(`${API_URL}/api/items`, { url, ...data }, {
        headers: getHeaders(token),
      });
      const newItem = response.data;
      set((state) => ({ items: [newItem, ...state.items] }));
      return newItem;
    } catch (error) {
      throw error;
    }
  },

  updateItem: async (token: string, id: string, data: Partial<SavedItem>) => {
    try {
      const response = await axios.put(`${API_URL}/api/items/${id}`, data, {
        headers: getHeaders(token),
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

  deleteItem: async (token: string, id: string) => {
    try {
      await axios.delete(`${API_URL}/api/items/${id}`, {
        headers: getHeaders(token),
      });
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },

  extractMetadata: async (token: string, url: string) => {
    const response = await axios.post(`${API_URL}/api/extract-metadata`, { url }, {
      headers: getHeaders(token),
    });
    return response.data;
  },

  setSortOrder: (order) => set({ sortOrder: order }),
  setPlatformFilter: (platform) => set({ platformFilter: platform }),

  searchItems: async (token: string, query: string) => {
    if (!query || query.length < 2) return [];
    const response = await axios.get(`${API_URL}/api/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders(token),
    });
    return response.data;
  },
}));
