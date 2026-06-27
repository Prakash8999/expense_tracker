import { create } from 'zustand';
import {
  getAccounts, getCategories, getTransactions, seedDefaultCategories,
  getSetting, setSetting, getBudgets, getGoals, getPlannedPayments,
  getDebts, getShoppingLists, getDocuments, getInvestments,
} from '../db/queries';
import { detectCurrencyFromLocale, type CurrencyInfo } from '../utils/currency';

export interface AppState {
  // ── Data ──────────────────────────────────────
  accounts: any[];
  categories: any[];
  expenseCategories: any[];
  incomeCategories: any[];
  transactions: any[];
  budgets: any[];
  goals: any[];
  plannedPayments: any[];
  debts: any[];
  shoppingLists: any[];
  documents: any[];
  investments: any[];

  // ── App State ─────────────────────────────────
  isLoading: boolean;
  isInitialized: boolean;
  currency: CurrencyInfo;
  isOnboarded: boolean;

  // ── Actions ───────────────────────────────────
  loadData: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadBudgets: () => Promise<void>;
  loadGoals: () => Promise<void>;
  loadPlannedPayments: () => Promise<void>;
  loadDebts: () => Promise<void>;
  loadShoppingLists: () => Promise<void>;
  loadDocuments: () => Promise<void>;
  loadInvestments: () => Promise<void>;
  setCurrency: (currency: CurrencyInfo) => void;
  setOnboarded: (v: boolean) => void;
  checkOnboarding: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  accounts: [],
  categories: [],
  expenseCategories: [],
  incomeCategories: [],
  transactions: [],
  budgets: [],
  goals: [],
  plannedPayments: [],
  debts: [],
  shoppingLists: [],
  documents: [],
  investments: [],
  isLoading: true,
  isInitialized: false,
  currency: detectCurrencyFromLocale(),
  isOnboarded: false,

  checkOnboarding: async () => {
    const onboarded = await getSetting('onboarded');
    const currencyCode = await getSetting('currency');
    const existingAccounts = await getAccounts();
    
    // Auto-bypass onboarding if they already have data (in case they closed app mid-onboarding)
    if (onboarded === 'true' || currencyCode || existingAccounts.length > 0) {
      set({ isOnboarded: true });
    }
    
    if (currencyCode) {
      const { getCurrencyByCode } = require('../utils/currency');
      set({ currency: getCurrencyByCode(currencyCode) });
    }
    set({ isInitialized: true });
  },

  loadData: async () => {
    set({ isLoading: true });
    await seedDefaultCategories();
    const [accountsData, allCategories, txns, budgetsData, goalsData, ppData, debtsData, slData, docsData, invData] = await Promise.all([
      getAccounts(),
      getCategories(),
      getTransactions(),
      getBudgets(),
      getGoals(),
      getPlannedPayments(),
      getDebts(),
      getShoppingLists(),
      getDocuments(),
      getInvestments(),
    ]);
    set({
      accounts: accountsData,
      categories: allCategories,
      expenseCategories: allCategories.filter((c: any) => c.type === 'expense'),
      incomeCategories: allCategories.filter((c: any) => c.type === 'income'),
      transactions: txns,
      budgets: budgetsData,
      goals: goalsData,
      plannedPayments: ppData,
      debts: debtsData,
      shoppingLists: slData,
      documents: docsData,
      investments: invData,
      isLoading: false,
    });
  },

  loadAccounts: async () => {
    const data = await getAccounts();
    set({ accounts: data });
  },

  loadTransactions: async () => {
    const data = await getTransactions();
    set({ transactions: data });
  },

  loadCategories: async () => {
    const data = await getCategories();
    set({
      categories: data,
      expenseCategories: data.filter((c: any) => c.type === 'expense'),
      incomeCategories: data.filter((c: any) => c.type === 'income'),
    });
  },

  loadBudgets: async () => { set({ budgets: await getBudgets() }); },
  loadGoals: async () => { set({ goals: await getGoals() }); },
  loadPlannedPayments: async () => { set({ plannedPayments: await getPlannedPayments() }); },
  loadDebts: async () => { set({ debts: await getDebts() }); },
  loadShoppingLists: async () => { set({ shoppingLists: await getShoppingLists() }); },
  loadDocuments: async () => { set({ documents: await getDocuments() }); },
  loadInvestments: async () => { set({ investments: await getInvestments() }); },

  setCurrency: (currency) => {
    set({ currency });
    setSetting('currency', currency.code);
  },

  setOnboarded: (v) => {
    set({ isOnboarded: v });
    setSetting('onboarded', v ? 'true' : 'false');
  },
}));
