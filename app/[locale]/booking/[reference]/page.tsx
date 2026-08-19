import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import {
  cancelByCustomer,
  nextDepartureFor,
  reconcileBooking,
} from "@/lib/booking/service";
import { getBookingStore } from "@/lib/booking/store";
import { formatUsd } from "@/lib/booking/money";
import { formatDepartureDate } from "@/lib/booking/format";
import { signTicket } from "@/lib/tickets/token";
import { rateLimit } from "@/lib/rate-limit";
import type { Booking } from "@/lib/booking/types";

export const dynamic = "force-dynamic";

type Params = { locale: string; reference: string };
type Strings = ReturnType<typeof getDictionary>["book"]["status"];

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
  const s = dict.book.status;

  // This route is reachable only by an unguessable reference, but it is
  // enumerable in principle — rate-limit per client so it cannot be swept.
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`booking-view:${ip}`, 40, 60_000).ok) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="text-base text-muted">{s.rateLimited}</p>
      </div>
    );
  }

  const booking = await reconcileBooking(reference);
  if (!booking) notFound();

  const store = getBookingStore();
  const departure = store.getDeparture(booking.departureId);
  const title = tourTitle(dict, booking.tourSlug);
  const departsLabel = departure
    ? formatDepartureDate(departure.date, locale)
    : "";

  const isConfirmed = booking.status === "confirmed";
  const qrDataUrl = isConfirmed
    ? await QRCode.toDataURL(signTicket(booking.id, booking.departureId), {
        margin: 1,
        width: 220,
      })
    : null;

  async function cancel() {
    "use server";
    await cancelByCustomer(reference);
    redirect(`/${locale}/booking/${reference}`);
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-12 md:py-16">
      <StatusHeader booking={booking} strings={s} email={booking.lead.email} />

      <dl className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
        <Row label={s.reference} value={booking.reference} mono />
        <Row label={s.departs} value={`${title} · ${departsLabel}`} />
        <Row label={s.party} value={String(booking.partySize)} />
        <Row label={s.depositPaid} value={formatUsd(booking.depositCents)} />
        <Row label={s.total} value={formatUsd(booking.totalCents)} />
      </dl>

      {isConfirmed && qrDataUrl ? (
        <section className="mt-8 rounded-card border border-line bg-paper p-6">
          <h2 className="font-display text-lg text-ink">{s.eticketTitle}</h2>
          <p className="mt-1 text-sm text-muted">{s.eticketBody}</p>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={s.qrAlt} src={qrDataUrl} width={180} height={180} className="rounded-control border border-line" />
            <div className="flex flex-col items-start gap-3">
              {booking.checkedInAt ? (
                <span className="inline-flex items-center gap-2 rounded-control border border-forest/30 bg-forest/5 px-3 py-1 text-sm font-medium text-forest">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-control bg-forest"
                  />
                  {s.checkedIn}
                </span>
              ) : null}
              <a
                href={`/${locale}/booking/${reference}/ticket`}
                data-tap="true"
                className="rounded-control border border-forest px-4 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-paper"
              >
                {s.downloadPdf}
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {booking.status === "hold_expired" ? (
        <ExpiredRecovery booking={booking} locale={locale} strings={s} />
      ) : null}

      {isConfirmed ? (
        <form action={cancel} className="mt-8">
          <button
            type="submit"
            className="rounded-control border border-line px-4 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
          >
            {s.cancel}
          </button>
          <p className="mt-2 text-xs text-muted">{s.cancelWithin}</p>
        </form>
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
  strings: Strings;
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
  strings: Strings;
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
        className="rounded-control bg-sun px-5 text-base font-medium text-ink transition hover:brightness-95"
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
