import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type {
  BookingDraft,
  CreateCheckoutResult,
  Money,
  PaymentProvider,
  PaymentStatus,
  VerifiedEvent,
  VerifiedEventType,
} from "./provider";

const SECRET =
  process.env.MOCK_PAYMENT_SECRET ?? "dev-mock-payment-secret-change-me";

type Record = { status: PaymentStatus; amount: Money; reference: string };

/**
 * A fully working provider with no real gateway behind it, so the entire booking
 * flow is exercisable today. It signs its webhooks with an HMAC exactly as a real
 * provider does, which is what makes the signature-verification and idempotency
 * guarantees testable.
 */
export class MockProvider implements PaymentProvider {
  readonly name = "mock";
  private readonly records = new Map<string, Record>();

  async createCheckout(draft: BookingDraft): Promise<CreateCheckoutResult> {
    const ref = `mock_${randomUUID()}`;
    this.records.set(ref, {
      status: "pending",
      amount: draft.deposit,
      reference: draft.reference,
    });
    // Redirect model. In production this is the provider's own hosted page; here
    // it is our mock page, which never receives card data either way.
    return {
      ref,
      redirectUrl: `/checkout/${draft.reference}?ref=${encodeURIComponent(ref)}`,
    };
  }

  async getStatus(ref: string): Promise<PaymentStatus> {
    return this.records.get(ref)?.status ?? "pending";
  }

  private sign(rawBody: string): string {
    return createHmac("sha256", SECRET).update(rawBody).digest("hex");
  }

  async verifyWebhook(
    rawBody: string,
    signature: string | null,
  ): Promise<VerifiedEvent | null> {
    if (!signature) return null;
    const expected = this.sign(rawBody);
    const expectedBuf = Buffer.from(expected, "utf8");
    const givenBuf = Buffer.from(signature, "utf8");
    if (
      expectedBuf.length !== givenBuf.length ||
      !timingSafeEqual(expectedBuf, givenBuf)
    ) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!isEventShape(parsed)) return null;
    return parsed;
  }

  /**
   * Simulate the provider processing a charge and emitting a webhook. Returns the
   * signed payload a real provider would POST to our webhook endpoint. Posting
   * the returned pair more than once is a genuine replay (same eventId).
   */
  emitEvent(
    ref: string,
    type: VerifiedEventType,
  ): { rawBody: string; signature: string } {
    const record = this.records.get(ref);
    const status: PaymentStatus =
      type === "payment.succeeded"
        ? "paid"
        : type === "payment.refunded"
          ? "refunded"
          : "failed";
    if (record) record.status = status;

    const event: VerifiedEvent = {
      ref,
      eventId: `evt_${randomUUID()}`,
      type,
      status,
      amount: record?.amount ?? { amountCents: 0, currency: "USD" },
    };
    const rawBody = JSON.stringify(event);
    return { rawBody, signature: this.sign(rawBody) };
  }
}

function isEventShape(value: unknown): value is VerifiedEvent {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Record & VerifiedEvent;
  return (
    typeof event.ref === "string" &&
    typeof event.eventId === "string" &&
    (event.type === "payment.succeeded" ||
      event.type === "payment.failed" ||
      event.type === "payment.refunded") &&
    typeof event.amount === "object"
  );
}
