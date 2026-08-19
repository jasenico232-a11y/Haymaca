export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "payment_failed"
  | "hold_expired"
  | "cancelled";

export type CancellationKind = "customer" | "weather";
export type DepartureStatus = "scheduled" | "cancelled_weather";

export type Departure = {
  id: string;
  tourSlug: string;
  date: string; // ISO yyyy-mm-dd
  seatsTotal: number;
  seatsAvailable: number;
  priceUsdPerPerson: number;
  depositPct: number; // 0..1, from the tour record
  status: DepartureStatus;
};

export type Hold = {
  id: string;
  departureId: string;
  partySize: number;
  expiresAt: number; // epoch ms
  status: "active" | "consumed" | "released";
};

export type Lead = { name: string; email: string; phone: string };

export type Booking = {
  id: string;
  reference: string; // unguessable uuid, customer-facing
  departureId: string;
  tourSlug: string;
  holdId: string;
  partySize: number;
  lead: Lead;
  totalCents: number;
  depositCents: number;
  currency: "USD";
  paymentRef: string | null;
  status: BookingStatus;
  eTicketIssued: boolean;
  cancellation: { kind: CancellationKind; at: number } | null;
  createdAt: number;
  updatedAt: number;
};
