import { create } from 'zustand';
import { getAccounts, getCategories, getTransactions, seedDefaultCategories } from '../db/queries';

interface AppState {
  accounts: any[];
  categories: any[];
  transactions: any[];
  isLoading: boolean;
  loadData: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  accounts: [],
  categories: [],
  transactions: [],
  isLoading: false,
  loadData: async () => {
    set({ isLoading: true });
    await seedDefaultCategories();
    const accountsData = await getAccounts();
    const categoriesData = await getCategories();
    const transactionsData = await getTransactions();
    set({
      accounts: accountsData,
      categories: categoriesData,
      transactions: transactionsData,
      isLoading: false,
    });
  },
}));
