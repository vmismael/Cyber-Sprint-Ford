import type { Booking, SchedulingDraft } from '@/types/scheduling';

const delay = (min: number, max: number) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min)) + min),
  );

const ALL_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:30',
  '11:00',
  '13:30',
  '14:00',
  '14:30',
  '15:30',
  '16:00',
  '17:00',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function fetchAvailableSlots(
  dealerId: string,
  dateISO: string,
): Promise<string[]> {
  await delay(200, 350);
  const seed = hashString(`${dealerId}:${dateISO}`);
  const offset = seed % 3;
  return ALL_SLOTS.filter((_, idx) => (idx + offset) % 2 === 0).slice(0, 6);
}

function generateProtocol(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `FRD-${digits}`;
}

function generateId(): string {
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type CreateBookingPayload = Required<
  Pick<SchedulingDraft, 'dealerId' | 'service' | 'mode' | 'date' | 'slot'>
> & {
  pickupAddress?: string;
  notes?: string;
};

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  await delay(500, 800);
  return {
    id: generateId(),
    protocol: generateProtocol(),
    dealerId: payload.dealerId,
    service: payload.service,
    mode: payload.mode,
    date: payload.date,
    slot: payload.slot,
    pickupAddress: payload.pickupAddress,
    notes: payload.notes,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
  };
}
