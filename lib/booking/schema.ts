import { z } from "zod";

/**
 * Validation shared by client and server. The client uses it for instant
 * feedback; the server re-parses every payload before it touches the store.
 * Client-side validation carries no security weight.
 */
export const leadSchema = z.object({
  name: z.string().trim().min(2, "name_too_short").max(120),
  email: z.email().max(200),
  phone: z
    .string()
    .trim()
    .min(7, "phone_too_short")
    .max(32)
    .regex(/^[+0-9 ()-]+$/, "phone_invalid"),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const holdRequestSchema = z.object({
  departureId: z.string().min(3).max(160),
  partySize: z.number().int().min(1).max(12),
});
export type HoldRequest = z.infer<typeof holdRequestSchema>;

export const bookingRequestSchema = z.object({
  holdId: z.uuid(),
  lead: leadSchema,
});
export type BookingRequest = z.infer<typeof bookingRequestSchema>;
