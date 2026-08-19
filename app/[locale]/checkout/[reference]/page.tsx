import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { getBooking, handleWebhook } from "@/lib/booking/service";
import { getMockProvider } from "@/lib/payments";
import { formatUsd } from "@/lib/booking/money";

export const dynamic = "force-dynamic";

type Params = { locale: string; reference: string };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, reference } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const booking = getBooking(reference);
  if (!booking) notFound();
  // Only pending bookings can pay; anything else belongs on the status page.
  if (booking.status !== "pending_payment")
    redirect(`/${locale}/booking/${reference}`);

  // These run on the provider's side of the fence: they emit a SIGNED webhook
  // and pass it through the same verified handler the real provider hits. The
  // button never sets "paid" itself — the webhook is the source of truth.
  async function payDeposit() {
    "use server";
    const current = getBooking(reference);
    if (current?.paymentRef) {
      const signed = getMockProvider().emitEvent(
        current.paymentRef,
        "payment.succeeded",
      );
      await handleWebhook(signed.rawBody, signed.signature);
    }
    redirect(`/${locale}/booking/${reference}`);
  }

  async function failDeposit() {
    "use server";
    const current = getBooking(reference);
    if (current?.paymentRef) {
      const signed = getMockProvider().emitEvent(
        current.paymentRef,
        "payment.failed",
      );
      await handleWebhook(signed.rawBody, signed.signature);
    }
    redirect(`/${locale}/booking/${reference}`);
  }

  const c = dict.book.checkout;

  return (
    <div className="mx-auto max-w-md px-5 py-12 md:py-16">
      <div className="rounded-card border border-line bg-paper p-6">
        <h1 className="font-display text-2xl text-ink">{c.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {c.hostedNote.replace("{provider}", c.provider)}
        </p>

        <dl className="mt-6 flex items-end justify-between border-t border-line pt-4">
          <dt className="text-sm uppercase tracking-wide text-muted">
            {c.depositDue}
          </dt>
          <dd className="font-display text-2xl font-semibold text-ink">
            {formatUsd(booking.depositCents)}
          </dd>
        </dl>

        <div className="mt-6">
          <label htmlFor="mock-card" className="text-sm font-medium text-ink">
            {c.cardField}
          </label>
          <input
            id="mock-card"
            disabled
            defaultValue="0000 0000 0000 0000"
            className="mt-1.5 w-full rounded-control border border-line bg-line/30 text-base text-muted"
          />
          <p className="mt-1 text-xs text-muted">{c.cardHint}</p>
        </div>

        <form action={payDeposit}>
          <button
            type="submit"
            className="mt-6 w-full rounded-control bg-forest px-5 text-base font-medium text-paper transition-colors hover:bg-ink"
          >
            {c.pay}
          </button>
        </form>
        <form action={failDeposit}>
          <button
            type="submit"
            className="mt-3 w-full rounded-control border border-line px-5 text-sm text-muted transition-colors hover:text-ink"
          >
            {c.fail}
          </button>
        </form>
      </div>
    </div>
  );
}
