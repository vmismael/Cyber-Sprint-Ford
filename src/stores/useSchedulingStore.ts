import { create } from 'zustand';
import { z } from 'zod';
import { secureStorage } from '@/services/secureStorage';
import type { Booking, SchedulingDraft } from '@/types/scheduling';

const BOOKINGS_KEY = 'ford.scheduling.bookings';

const bookingSchema = z.object({
  id: z.string(),
  protocol: z.string(),
  dealerId: z.string(),
  service: z.enum(['revision', 'oil-change', 'tires', 'diagnostics', 'other']),
  mode: z.enum(['in-person', 'pickup-delivery']),
  date: z.string(),
  slot: z.string(),
  pickupAddress: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  status: z.enum(['confirmed', 'cancelled']),
});

const bookingsSchema = z.array(bookingSchema);

type SchedulingState = {
  hydrated: boolean;
  draft: SchedulingDraft;
  bookings: Booking[];
  hydrate: () => Promise<void>;
  startDraft: (dealerId: string) => void;
  startDraftWithSuggestion: (suggestion: SchedulingDraft) => void;
  updateDraft: (patch: Partial<SchedulingDraft>) => void;
  resetDraft: () => void;
  commitBooking: (booking: Booking) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  clearBookings: () => Promise<void>;
};

export const useSchedulingStore = create<SchedulingState>((set, get) => ({
  hydrated: false,
  draft: {},
  bookings: [],

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await secureStorage.getItem(BOOKINGS_KEY);
      let bookings: Booking[] = [];
      if (raw) {
        const parsed = bookingsSchema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          bookings = parsed.data;
        } else {
          // Dado corrompido — descarta silenciosamente
          await secureStorage.removeItem(BOOKINGS_KEY);
        }
      }
      set({ hydrated: true, bookings });
    } catch {
      set({ hydrated: true, bookings: [] });
    }
  },

  startDraft: (dealerId) => set({ draft: { dealerId } }),

  startDraftWithSuggestion: (suggestion) => set({ draft: { ...suggestion } }),

  updateDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

  resetDraft: () => set({ draft: {} }),

  commitBooking: async (booking) => {
    const next = [booking, ...get().bookings];
    await secureStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
    set({ bookings: next, draft: {} });
  },

  cancelBooking: async (id) => {
    const next = get().bookings.map((b) =>
      b.id === id ? { ...b, status: 'cancelled' as const } : b,
    );
    await secureStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
    set({ bookings: next });
  },

  clearBookings: async () => {
    await secureStorage.removeItem(BOOKINGS_KEY);
    set({ bookings: [] });
  },
}));
