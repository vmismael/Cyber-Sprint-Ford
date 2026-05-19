export type TransactionCategory = 'fuel' | 'maintenance' | 'tires' | 'other' | 'redemption';
export type TransactionType = 'credit' | 'debit';
export type CouponCategory = 'fuel' | 'maintenance' | 'tires';
export type PlanFilter = 'agro' | 'urban' | 'premium' | 'all';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: TransactionCategory;
  date: string;
  dealerName?: string;
};

export type Coupon = {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: CouponCategory;
  merchant: string;
  expiresAt: string;
  distanceKm: number;
  isNearby: boolean;
  plan: PlanFilter;
  redeemed: boolean;
};

export type WalletData = {
  balance: number;
  transactions: Transaction[];
};

export type FuelStation = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
};
