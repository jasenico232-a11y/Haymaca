"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leadSchema } from "@/lib/booking/schema";
import type { Locale } from "@/i18n/config";

export type DepartureOption = {
  id: string;
  dateLabel: string;
  seatsAvailable: number;
  soldOut: boolean;
  priceCents: number;
  depositPct: number;
};

type Labels = {
  chooseDeparture: string;
  seatsLeft: string; // "{n} seats left"
  departureOption: string; // "{date}: {seats}, {price} each"
  soldOut: string;
  partyLabel: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  continue: string;
  holding: string;
  requirements: string;
  requirementsHint: string;
  depositLine: string; // "Deposit due now: {deposit} of {total}"
  errors: {
    sold_out: string;
    hold_invalid: string;
    departure_cancelled: string;
    invalid: string;
    network: string;
  };
  validation: { name: string; email: string; phone: string };
};

function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });
}

export function BookingForm({
  locale,
  departures,
  labels,
}: {
  locale: Locale;
  departures: DepartureOption[];
  labels: Labels;
}) {
  const router = useRouter();
  const firstOpen = departures.find((d) => !d.soldOut)?.id ?? "";
  const [departureId, setDepartureId] = useState(firstOpen);
  const [party, setParty] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requirements, setRequirements] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function errorFor(reason: unknown): string {
    const key = typeof reason === "string" ? reason : "network";
    return (labels.errors as Record<string, string>)[key] ?? labels.errors.network;
  }

  const selected = departures.find((d) => d.id === departureId) ?? null;
  const totalCents = selected ? selected.priceCents * party : 0;
  const depositCents = selected
    ? Math.round(totalCents * selected.depositPct)
    : 0;

  const depositLine = labels.depositLine
    .replace("{deposit}", usd(depositCents))
    .replace("{total}", usd(totalCents));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = leadSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (key === "name") next.name = labels.validation.name;
        if (key === "email") next.email = labels.validation.email;
        if (key === "phone") next.phone = labels.validation.phone;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const holdRes = await fetch("/api/holds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ departureId, partySize: party }),
      });
      if (!holdRes.ok) {
        const data = await holdRes.json().catch(() => ({}));
        setFormError(errorFor((data as { error?: unknown }).error));
        setSubmitting(false);
        return;
      }
      const { holdId } = (await holdRes.json()) as { holdId: string };

      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          holdId,
          lead: parsed.data,
          ...(requirements.trim()
            ? { requirements: requirements.trim() }
            : {}),
        }),
      });
      if (!bookingRes.ok) {
        const data = await bookingRes.json().catch(() => ({}));
        setFormError(errorFor((data as { error?: unknown }).error));
        setSubmitting(false);
        return;
      }
      const { redirectUrl } = (await bookingRes.json()) as {
        redirectUrl?: string;
      };
      if (redirectUrl) {
        const dest = redirectUrl.startsWith("/checkout")
          ? `/${locale}${redirectUrl}`
          : redirectUrl;
        router.push(dest);
        return;
      }
      setFormError(labels.errors.network);
      setSubmitting(false);
    } catch {
      setFormError(labels.errors.network);
      setSubmitting(false);
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-control border border-line bg-paper text-base text-ink transition-colors focus:border-river";
  const labelClass = "text-sm font-medium text-ink";
  const errorClass = "mt-1 text-sm font-medium text-ink";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-card border border-line bg-paper p-5 sm:p-6"
    >
      <div>
        <label htmlFor="departure" className={labelClass}>
          {labels.chooseDeparture}
        </label>
        <select
          id="departure"
          className={fieldClass}
          value={departureId}
          onChange={(event) => setDepartureId(event.target.value)}
        >
          {departures.map((option) => {
            const seats = option.soldOut
              ? labels.soldOut
              : labels.seatsLeft.replace("{n}", String(option.seatsAvailable));
            return (
              <option
                key={option.id}
                value={option.id}
                disabled={option.soldOut}
              >
                {labels.departureOption
                  .replace("{date}", option.dateLabel)
                  .replace("{seats}", seats)
                  .replace("{price}", usd(option.priceCents))}
              </option>
            );
          })}
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="party" className={labelClass}>
          {labels.partyLabel}
        </label>
        <select
          id="party"
          className={fieldClass}
          value={party}
          onChange={(event) => setParty(Number(event.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="name" className={labelClass}>
          {labels.leadName}
        </label>
        <input
          id="name"
          className={fieldClass}
          value={name}
          autoComplete="name"
          onChange={(event) => setName(event.target.value)}
          aria-invalid={fieldErrors.name ? "true" : undefined}
        />
        {fieldErrors.name ? <p className={errorClass}>{fieldErrors.name}</p> : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>
            {labels.leadEmail}
          </label>
          <input
            id="email"
            type="email"
            className={fieldClass}
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={fieldErrors.email ? "true" : undefined}
          />
          {fieldErrors.email ? (
            <p className={errorClass}>{fieldErrors.email}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            {labels.leadPhone}
          </label>
          <input
            id="phone"
            type="tel"
            className={fieldClass}
            value={phone}
            autoComplete="tel"
            onChange={(event) => setPhone(event.target.value)}
            aria-invalid={fieldErrors.phone ? "true" : undefined}
          />
          {fieldErrors.phone ? (
            <p className={errorClass}>{fieldErrors.phone}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="requirements" className={labelClass}>
          {labels.requirements}
        </label>
        <textarea
          id="requirements"
          rows={2}
          className={fieldClass}
          value={requirements}
          onChange={(event) => setRequirements(event.target.value)}
        />
        <p className="mt-1 text-xs text-muted">{labels.requirementsHint}</p>
      </div>

      {selected ? (
        <p className="mt-5 text-base font-medium text-ink">{depositLine}</p>
      ) : null}

      {formError ? (
        <p className="mt-3 rounded-control border border-sun bg-sun/10 px-3 py-2 text-sm font-medium text-ink">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || !selected}
        className="mt-5 w-full rounded-control bg-sun px-5 text-base font-medium text-ink transition hover:brightness-95 disabled:opacity-60"
      >
        {submitting ? labels.holding : labels.continue}
      </button>
    </form>
  );
}
