import { create } from 'zustand';
import { z } from 'zod';
import { secureStorage } from '@/services/secureStorage';
import type { Coupon, Transaction } from '@/features/cashback/types';
import { fetchCoupons, fetchWallet, redeemCoupon } from '@/services/mocks/walletApi';

const BALANCE_KEY = 'ford.wallet.balance';
const TRANSACTIONS_KEY = 'ford.wallet.transactions';
const COUPONS_KEY = 'ford.wallet.coupons';

const transactionSchema = z.object({
  id: z.string(),
  type: z.enum(['credit', 'debit']),
  amount: z.number(),
  description: z.string(),
  date: z.string(),
  category: z.string(),
  dealerName: z.string().optional(),
});

const couponSchema = z.object({
  id: z.string(),
  title: z.string(),
  discount: z.number(),
  expiresAt: z.string(),
  redeemed: z.boolean(),
  plan: z.string(),
  stationId: z.string().optional(),
});

const transactionsSchema = z.array(transactionSchema);
const couponsSchema = z.array(couponSchema);

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
        secureStorage.getItem(BALANCE_KEY),
        secureStorage.getItem(TRANSACTIONS_KEY),
        secureStorage.getItem(COUPONS_KEY),
      ]);
      const balance = rawBalance ? parseFloat(rawBalance) : 0;
      const txParsed = rawTx ? transactionsSchema.safeParse(JSON.parse(rawTx)) : null;
      const couponsParsed = rawCoupons ? couponsSchema.safeParse(JSON.parse(rawCoupons)) : null;
      set({
        hydrated: true,
        balance: isNaN(balance) ? 0 : balance,
        transactions: txParsed?.success ? txParsed.data : [],
        coupons: couponsParsed?.success ? couponsParsed.data : [],
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
        secureStorage.setItem(BALANCE_KEY, String(data.balance)),
        secureStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data.transactions)),
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
      await secureStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
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
        secureStorage.setItem(BALANCE_KEY, String(newBalance)),
        secureStorage.setItem(COUPONS_KEY, JSON.stringify(updatedCoupons)),
      ]);
      set({ balance: newBalance, coupons: updatedCoupons, celebrateVisible: true });
    } finally {
      set({ loading: false });
    }
  },

  dismissCelebrate: () => set({ celebrateVisible: false }),

  reset: async () => {
    await Promise.all([
      secureStorage.removeItem(BALANCE_KEY),
      secureStorage.removeItem(TRANSACTIONS_KEY),
      secureStorage.removeItem(COUPONS_KEY),
    ]);
    set({ balance: 0, transactions: [], coupons: [], hydrated: true, error: null });
  },
}));
