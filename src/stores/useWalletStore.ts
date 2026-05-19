import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coupon, Transaction } from '@/features/cashback/types';
import { fetchCoupons, fetchWallet, redeemCoupon } from '@/services/mocks/walletApi';

const BALANCE_KEY = 'ford.wallet.balance';
const TRANSACTIONS_KEY = 'ford.wallet.transactions';
const COUPONS_KEY = 'ford.wallet.coupons';

type WalletState = {
  hydrated: boolean;
  balance: number;
  transactions: Transaction[];
  coupons: Coupon[];
  loading: boolean;
  error: string | null;
  celebrateVisible: boolean;
  hydrate: () => Promise<void>;
  fetchWallet: () => Promise<void>;
  fetchCoupons: (planId: string) => Promise<void>;
  redeemCoupon: (couponId: string, stationId: string) => Promise<void>;
  dismissCelebrate: () => void;
  reset: () => Promise<void>;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  hydrated: false,
  balance: 0,
  transactions: [],
  coupons: [],
  loading: false,
  error: null,
  celebrateVisible: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [rawBalance, rawTx, rawCoupons] = await Promise.all([
        AsyncStorage.getItem(BALANCE_KEY),
        AsyncStorage.getItem(TRANSACTIONS_KEY),
        AsyncStorage.getItem(COUPONS_KEY),
      ]);
      set({
        hydrated: true,
        balance: rawBalance ? parseFloat(rawBalance) : 0,
        transactions: rawTx ? (JSON.parse(rawTx) as Transaction[]) : [],
        coupons: rawCoupons ? (JSON.parse(rawCoupons) as Coupon[]) : [],
      });
    } catch {
      set({ hydrated: true });
    }
  },

  fetchWallet: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchWallet();
      await Promise.all([
        AsyncStorage.setItem(BALANCE_KEY, String(data.balance)),
        AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data.transactions)),
      ]);
      set({ balance: data.balance, transactions: data.transactions });
    } catch {
      set({ error: 'Não foi possível carregar sua carteira.' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCoupons: async (planId) => {
    try {
      const coupons = await fetchCoupons(planId);
      await AsyncStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
      set({ coupons });
    } catch {
      // keep stale coupons on error
    }
  },

  redeemCoupon: async (couponId, stationId) => {
    set({ loading: true });
    try {
      const { newBalance } = await redeemCoupon(couponId, stationId);
      const updatedCoupons = get().coupons.map((c) =>
        c.id === couponId ? { ...c, redeemed: true } : c,
      );
      await Promise.all([
        AsyncStorage.setItem(BALANCE_KEY, String(newBalance)),
        AsyncStorage.setItem(COUPONS_KEY, JSON.stringify(updatedCoupons)),
      ]);
      set({ balance: newBalance, coupons: updatedCoupons, celebrateVisible: true });
    } finally {
      set({ loading: false });
    }
  },

  dismissCelebrate: () => set({ celebrateVisible: false }),

  reset: async () => {
    await AsyncStorage.multiRemove([BALANCE_KEY, TRANSACTIONS_KEY, COUPONS_KEY]);
    set({ balance: 0, transactions: [], coupons: [], hydrated: true, error: null });
  },
}));
