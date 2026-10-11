"use client";

import { useId, useState } from "react";

type Option = { value: string; label: string };

type Labels = {
  title: string;
  subtitle: string;
  whereLabel: string;
  wherePrompt: string;
  whenLabel: string;
  whenPrompt: string;
  partyLabel: string;
  partyPrompt: string;
  submit: string;
  submitHint: string;
  validation: string;
  /** Written into the message for a question left blank. */
  unset: string;
};

type Props = {
  labels: Labels;
  destinations: Option[];
  months: Option[];
  party: Option[];
  /** Template with {where} {when} {party} tokens. */
  waTemplate: string;
  /** Human phone string; non-digits are stripped for the wa.me link. */
  phone: string;
};

/**
 * Three low-commitment questions that hand off to WhatsApp with the answers
 * pre-written, since WhatsApp is how most Jamaican operators reply fastest. No
 * backend, no account, no payment: this is the top of an enquiry, not a checkout.
 */
export function EnquiryWidget({
  labels,
  destinations,
  months,
  party,
  waTemplate,
  phone,
}: Props) {
  const uid = useId();
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [who, setWho] = useState("");
  const [showError, setShowError] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const missingWhere = where === "";

  function labelFor(list: Option[], value: string, fallback: string) {
    return list.find((option) => option.value === value)?.label ?? fallback;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (missingWhere) {
      setShowError(true);
      return;
    }
    const text = waTemplate
      .replace("{where}", labelFor(destinations, where, labels.unset))
      .replace("{when}", labelFor(months, when, labels.unset))
      .replace("{party}", labelFor(party, who, labels.unset));
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const fieldClass =
    "mt-1.5 w-full rounded-control border border-line bg-paper text-base text-ink transition-colors focus:border-river aria-[invalid=true]:border-sun";
  const labelClass = "text-sm font-medium text-ink";

  return (
    <form
      id="enquiry"
      onSubmit={onSubmit}
      noValidate
      className="scroll-mt-24 rounded-card border border-line bg-paper p-5 shadow-sm sm:p-6"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-muted">{labels.subtitle}</p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor={`${uid}-where`} className={labelClass}>
            {labels.whereLabel}
          </label>
          <select
            id={`${uid}-where`}
            className={fieldClass}
            value={where}
            aria-invalid={showError && missingWhere ? "true" : undefined}
            aria-describedby={
              showError && missingWhere ? `${uid}-where-error` : undefined
            }
            onChange={(event) => {
              setWhere(event.target.value);
              if (event.target.value) setShowError(false);
            }}
          >
            <option value="" disabled>
              {labels.wherePrompt}
            </option>
            {destinations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {showError && missingWhere ? (
            <p
              id={`${uid}-where-error`}
              className="mt-1.5 text-sm font-medium text-ink"
            >
              {labels.validation}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${uid}-when`} className={labelClass}>
            {labels.whenLabel}
          </label>
          <select
            id={`${uid}-when`}
            className={fieldClass}
            value={when}
            onChange={(event) => setWhen(event.target.value)}
          >
            <option value="" disabled>
              {labels.whenPrompt}
            </option>
            {months.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${uid}-party`} className={labelClass}>
            {labels.partyLabel}
          </label>
          <select
            id={`${uid}-party`}
            className={fieldClass}
            value={who}
            onChange={(event) => setWho(event.target.value)}
          >
            <option value="" disabled>
              {labels.partyPrompt}
            </option>
            {party.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="mt-5 w-full rounded-control bg-sun px-5 text-base font-medium text-ink transition hover:brightness-95"
      >
        {labels.submit}
      </button>
      <p className="mt-2 text-xs text-muted">{labels.submitHint}</p>
    </form>
  );
}
