"use server";

import {
  createPublicBooking,
  getAccountBySlug,
  getAvailableSlots,
  type BookingResult,
  type Slot,
} from "@/lib/booking";

/** Devuelve los horarios disponibles. La cuenta se resuelve del slug (servidor). */
export async function slotsAction(input: {
  slug: string;
  locationId: string;
  professionalId: string | null;
  serviceId: string;
  dateStr: string;
}): Promise<Slot[]> {
  const account = await getAccountBySlug(input.slug);
  if (!account) return [];
  return getAvailableSlots({
    ownerId: account.ownerId,
    locationId: input.locationId,
    professionalId: input.professionalId,
    serviceId: input.serviceId,
    dateStr: input.dateStr,
  });
}

/** Crea la reserva (rate-limit + validación + cuenta por slug, en servidor). */
export async function bookingAction(input: {
  slug: string;
  locationId: string;
  professionalId: string | null;
  serviceId: string;
  dateStr: string;
  timeMin: number;
  name: string;
  phone: string;
  email?: string;
}): Promise<BookingResult> {
  return createPublicBooking(input);
}
