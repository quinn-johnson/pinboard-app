import { create } from 'zustand';
import { Party, Item } from './types';
import { db } from './db';

interface AppState {
  parties: Party[];
  items: Item[];
  selectedPartyId: string | null;
  selectedView: 'all' | 'starred' | 'party';
  newItemText: string;
  selectedPartyIds: string[];
  isCreatingParty: boolean;
  newPartyName: string;

  setParties: (parties: Party[]) => void;
  setItems: (items: Item[]) => void;
  setSelectedPartyId: (id: string | null) => void;
  setSelectedView: (view: 'all' | 'starred' | 'party') => void;
  setNewItemText: (text: string) => void;
  setSelectedPartyIds: (ids: string[]) => void;
  togglePartySelection: (id: string) => void;
  setIsCreatingParty: (isCreating: boolean) => void;
  setNewPartyName: (name: string) => void;
  refreshItems: () => Promise<void>;
  refreshParties: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  parties: [],
  items: [],
  selectedPartyId: null,
  selectedView: 'all',
  newItemText: '',
  selectedPartyIds: [],
  isCreatingParty: false,
  newPartyName: '',

  setParties: (parties) => set({ parties }),
  setItems: (items) => set({ items }),
  setSelectedPartyId: (id) => set({ selectedPartyId: id, selectedView: 'party' }),
  setSelectedView: (view) => set({ selectedView: view, selectedPartyId: null }),
  setNewItemText: (text) => set({ newItemText: text }),
  setSelectedPartyIds: (ids) => set({ selectedPartyIds: ids }),

  togglePartySelection: (id) => {
    const { selectedPartyIds } = get();
    const newIds = selectedPartyIds.includes(id)
      ? selectedPartyIds.filter(pid => pid !== id)
      : [...selectedPartyIds, id];
    set({ selectedPartyIds: newIds });
  },

  setIsCreatingParty: (isCreating) => set({ isCreatingParty: isCreating }),
  setNewPartyName: (name) => set({ newPartyName: name }),

  refreshItems: async () => {
    // Always load all items so sidebar counts are accurate
    const items = await db.getAllItems();
    set({ items });
  },

  refreshParties: async () => {
    const parties = await db.getParties();
    set({ parties });
  }
}));
