import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { isOperatorAuthed, OPERATOR_COOKIE } from "@/lib/operator/auth";
import { getBookingStore } from "@/lib/booking/store";
import { cancelDepartureForWeather } from "@/lib/booking/service";
import { formatDepartureDate, interpolate } from "@/lib/booking/format";
import type { Booking } from "@/lib/booking/types";

export const dynamic = "force-dynamic";

const MIN_DATE = "2026-08-19";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

type Params = { locale: string };
type Search = { date?: string };

export default async function OperatorPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isOperatorAuthed())) redirect(`/${locale}/operator/login`);

  const dict = getDictionary(locale);
  const op = dict.operator;
  const items = dict.tours.items as Record<string, { title: string }>;
  const store = getBookingStore();

  const allDates = [...new Set(store.listDepartures().map((d) => d.date))]
    .filter((d) => d >= MIN_DATE)
    .sort();
  const requested = (await searchParams).date;
  const date =
    requested && ISO.test(requested) && allDates.includes(requested)
      ? requested
      : (allDates[0] ?? MIN_DATE);

  const departures = store.departuresOnDate(date);

  async function signOut() {
    "use server";
    (await cookies()).delete(OPERATOR_COOKIE);
    redirect(`/${locale}/operator/login`);
  }

  async function cancelWeather(formData: FormData) {
    "use server";
    const id = formData.get("departureId");
    if (typeof id === "string") await cancelDepartureForWeather(id);
    redirect(`/${locale}/operator?date=${date}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink md:text-3xl">{op.title}</h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/operator/scan`}
            data-tap="true"
            className="rounded-control bg-forest px-4 text-sm font-medium text-paper transition-colors hover:bg-ink"
          >
            {op.scan}
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-control border border-line px-4 text-sm text-muted transition-colors hover:text-ink"
            >
              {op.signOut}
            </button>
          </form>
        </div>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="date" className="text-sm font-medium text-ink">
            {op.dateLabel}
          </label>
          <select
            id="date"
            name="date"
            defaultValue={date}
            className="mt-1.5 rounded-control border border-line bg-paper text-base text-ink"
          >
            {allDates.map((d) => (
              <option key={d} value={d}>
                {formatDepartureDate(d, locale)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-control border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
        >
          {op.dateLabel}
        </button>
      </form>

      {departures.length === 0 ? (
        <p className="mt-8 text-base text-muted">{op.noDepartures}</p>
      ) : (
        <div className="mt-8 space-y-8">
          {departures.map((departure) => {
            const bookings = store.bookingsForDeparture(departure.id);
            const booked = store
              .confirmedBookingsForDeparture(departure.id)
              .reduce((sum, b) => sum + b.partySize, 0);
            return (
              <section
                key={departure.id}
                className="overflow-hidden rounded-card border border-line"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper p-4">
                  <div>
                    <h2 className="font-display text-lg text-ink">
                      {items[departure.tourSlug]?.title ?? departure.tourSlug}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted">
                      {interpolate(op.seats, {
                        booked,
                        total: departure.seatsTotal,
                      })}
                    </p>
                  </div>
                  {departure.status === "cancelled_weather" ? (
                    <span className="rounded-control border border-sun bg-sun/10 px-3 py-1 text-sm font-medium text-ink">
                      {op.cancelledWeather}
                    </span>
                  ) : (
                    <form action={cancelWeather}>
                      <input
                        type="hidden"
                        name="departureId"
                        value={departure.id}
                      />
                      <button
                        type="submit"
                        className="rounded-control border border-line px-3 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
                      >
                        {op.cancelWeather}
                      </button>
                    </form>
                  )}
                </header>

                {bookings.length === 0 ? (
                  <p className="bg-paper p-4 text-sm text-muted">{op.none}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse bg-paper text-left text-sm">
                      <thead>
                        <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                          <th className="p-3 font-medium">{op.guest}</th>
                          <th className="p-3 font-medium">{op.party}</th>
                          <th className="p-3 font-medium">{op.contact}</th>
                          <th className="p-3 font-medium">{op.requirements}</th>
                          <th className="p-3 font-medium">{op.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-line last:border-0">
                            <td className="p-3 font-medium text-ink">
                              {booking.lead.name}
                            </td>
                            <td className="p-3 text-ink">{booking.partySize}</td>
                            <td className="p-3 text-ink">{booking.lead.phone}</td>
                            <td className="p-3 text-muted">
                              {booking.requirements || op.none}
                            </td>
                            <td className="p-3">
                              <GuestStatus booking={booking} op={op} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GuestStatus({
  booking,
  op,
}: {
  booking: Booking;
  op: ReturnType<typeof getDictionary>["operator"];
}) {
  if (booking.status === "cancelled")
    return <span className="text-muted">{op.cancelledWeather}</span>;
  if (booking.checkedInAt)
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-forest">
        <span aria-hidden="true" className="h-2 w-2 rounded-control bg-forest" />
        {op.checkedIn}
      </span>
    );
  return <span className="text-muted">{op.expected}</span>;
}
