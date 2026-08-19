import { notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { nextDepartureFor, reconcileBooking } from "@/lib/booking/service";
import { getBookingStore } from "@/lib/booking/store";
import { formatUsd } from "@/lib/booking/money";
import { formatDepartureDate } from "@/lib/booking/format";
import type { Booking } from "@/lib/booking/types";

export const dynamic = "force-dynamic";

type Params = { locale: string; reference: string };

function tourTitle(dict: ReturnType<typeof getDictionary>, slug: string): string {
  const items = dict.tours.items as Record<string, { title: string }>;
  return items[slug]?.title ?? slug;
}

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, reference } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  // Server-side reconciliation — the status shown is derived from the store /
  // provider, never from anything the client asserts.
  const booking = await reconcileBooking(reference);
  if (!booking) notFound();

  const store = getBookingStore();
  const departure = store.getDeparture(booking.departureId);
  const s = dict.book.status;
  const title = tourTitle(dict, booking.tourSlug);
  const departsLabel = departure
    ? formatDepartureDate(departure.date, locale as Locale)
    : "";

  return (
    <div className="mx-auto max-w-xl px-5 py-12 md:py-16">
      <StatusHeader booking={booking} strings={s} email={booking.lead.email} />

      <dl className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
        <Row label={s.reference} value={booking.reference} mono />
        <Row label={s.departs} value={`${title} · ${departsLabel}`} />
        <Row label={s.party} value={String(booking.partySize)} />
        <Row
          label={s.depositPaid}
          value={formatUsd(booking.depositCents)}
        />
        <Row label={s.total} value={formatUsd(booking.totalCents)} />
      </dl>

      {booking.status === "hold_expired" ? (
        <ExpiredRecovery booking={booking} locale={locale as Locale} strings={s} />
      ) : null}

      <div className="mt-8">
        <Link
          href={`/${locale}/tours`}
          data-tap="true"
          className="text-sm text-river transition-colors hover:text-ink"
        >
          {s.browse}
        </Link>
      </div>
    </div>
  );
}

function StatusHeader({
  booking,
  strings,
  email,
}: {
  booking: Booking;
  strings: ReturnType<typeof getDictionary>["book"]["status"];
  email: string;
}) {
  const map: Record<Booking["status"], { title: string; body: string; dot: string }> =
    {
      confirmed: {
        title: strings.confirmedTitle,
        body: strings.confirmedBody.replace("{email}", email),
        dot: "bg-forest",
      },
      pending_payment: {
        title: strings.pendingTitle,
        body: strings.pendingBody,
        dot: "bg-river",
      },
      payment_failed: {
        title: strings.failedTitle,
        body: strings.failedBody,
        dot: "bg-sun",
      },
      hold_expired: {
        title: strings.expiredTitle,
        body: strings.expiredBody,
        dot: "bg-sun",
      },
      cancelled: {
        title: strings.cancelledTitle,
        body:
          booking.cancellation?.kind === "weather"
            ? strings.cancelledWeather
            : strings.cancelledCustomer,
        dot: "bg-muted",
      },
    };
  const view = map[booking.status];
  return (
    <header>
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`inline-block h-3 w-3 rounded-control ${view.dot}`}
        />
        <h1 className="font-display text-2xl text-ink md:text-3xl">
          {view.title}
        </h1>
      </div>
      <p className="mt-3 text-base text-muted">{view.body}</p>
    </header>
  );
}

function ExpiredRecovery({
  booking,
  locale,
  strings,
}: {
  booking: Booking;
  locale: Locale;
  strings: ReturnType<typeof getDictionary>["book"]["status"];
}) {
  const next = nextDepartureFor(booking);
  if (!next)
    return (
      <p className="mt-6 rounded-card border border-line bg-paper p-5 text-base text-muted">
        {strings.expiredNoNext}
      </p>
    );
  return (
    <div className="mt-6">
      <Link
        href={`/${locale}/book/${booking.tourSlug}`}
        data-tap="true"
        className="rounded-control bg-forest px-5 text-base font-medium text-paper transition-colors hover:bg-ink"
      >
        {strings.rebook.replace("{date}", formatDepartureDate(next.date, locale))}
      </Link>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-paper p-4">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-1 text-base text-ink ${mono ? "break-all font-medium" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
