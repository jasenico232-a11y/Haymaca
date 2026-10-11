/**
 * Payment provider abstraction.
 *
 * The provider is deliberately undecided: Stripe does not serve Jamaica-based
 * businesses, so the live provider will be WiPay, First Atlantic Commerce or
 * PayPal. Everything the booking flow needs is expressed through this interface,
 * so a real provider is a single new file that implements it, and nothing else in
 * the app imports a provider directly (see lib/payments/index.ts).
 *
 * Two rules the interface encodes:
 *  - Card data never reaches us. createCheckout returns either a hosted redirect
 *    URL or a hosted-fields config; the customer's card goes straight to the
 *    provider, never through our routes.
 *  - The webhook (or a server-side getStatus reconciliation) is the only source
 *    of truth for "paid". There is no method that lets a client assert payment.
 */

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Money = { amountCents: number; currency: "USD" };

export type LeadDetails = { name: string; email: string; phone: string };

export type BookingDraft = {
  bookingId: string;
  reference: string;
  tourSlug: string;
  departureId: string;
  partySize: number;
  /** The amount to charge now: the deposit only, computed server-side. */
  deposit: Money;
  /** Full trip price, for records and display. Never charged here. */
  total: Money;
  lead: LeadDetails;
  /** Where the provider returns the customer after a hosted redirect. */
  returnUrl: string;
};

/**
 * Opaque config a provider's client SDK needs to mount hosted fields. It carries
 * no secret of ours; the client uses it to post card data directly to the
 * provider.
 */
export type HostedFieldsConfig = {
  provider: string;
  token: string;
  fields: string[];
};

export type CreateCheckoutResult = {
  /** Provider payment reference, the idempotency key for the whole payment. */
  ref: string;
  redirectUrl?: string;
  hostedFields?: HostedFieldsConfig;
};

export type VerifiedEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded";

export type VerifiedEvent = {
  ref: string;
  /** Provider's unique event id, the webhook idempotency key. */
  eventId: string;
  type: VerifiedEventType;
  status: PaymentStatus;
  amount: Money;
};

export interface PaymentProvider {
  readonly name: string;

  /** Start a checkout for the deposit. Returns a redirect URL or hosted-fields
   *  config plus the payment ref. Never sees or returns card data. */
  createCheckout(draft: BookingDraft): Promise<CreateCheckoutResult>;

  /** Validate a webhook's signature over the raw body. Returns the parsed event
   *  on success, or null when the signature is missing or wrong. */
  verifyWebhook(
    rawBody: string,
    signature: string | null,
  ): Promise<VerifiedEvent | null>;

  /** Server-side truth for a payment, for reconciling a redirect return without
   *  trusting the client. */
  getStatus(ref: string): Promise<PaymentStatus>;
}
