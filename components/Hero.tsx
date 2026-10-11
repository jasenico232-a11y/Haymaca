import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { destinationOrder } from "@/lib/destinations";
import { tourCount } from "@/lib/tours/summary";
import { EnquiryWidget } from "./EnquiryWidget";

export function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const destinations = destinationOrder.map((slug) => ({
    value: slug,
    label: dict.destinations.items[slug].name,
  }));

  const months = (
    Object.keys(dict.enquiry.months) as Array<
      keyof Dictionary["enquiry"]["months"]
    >
  ).map((key) => ({ value: key, label: dict.enquiry.months[key] }));

  const party = (
    Object.keys(dict.enquiry.party) as Array<
      keyof Dictionary["enquiry"]["party"]
    >
  ).map((key) => ({ value: key, label: dict.enquiry.party[key] }));

  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-12 md:grid-cols-12 md:gap-8 md:pb-24 md:pt-20">
        <div className="md:col-span-7 md:pr-6">
          <h1 className="max-w-[14ch] font-display text-2xl font-semibold tracking-[-0.015em] text-ink sm:text-3xl">
            {dict.hero.headline}
          </h1>
          <p className="mt-7 max-w-xl text-lg text-muted">{dict.hero.body}</p>
          <p className="mt-5 max-w-xl text-base font-medium text-ink">
            {dict.hero.priceNote}
          </p>

          <p className="mt-10 max-w-xl border-t border-line pt-5 text-base text-muted">
            {dict.hero.toursLead}{" "}
            <Link
              href={`/${locale}/tours`}
              className="font-medium text-forest underline decoration-forest/40 decoration-2 transition-colors hover:decoration-forest"
            >
              {dict.hero.toursLink.replace("{n}", String(tourCount))}
            </Link>
          </p>
        </div>

        <div className="md:col-span-5 md:pt-2">
          <EnquiryWidget
            labels={{
              title: dict.enquiry.title,
              subtitle: dict.enquiry.subtitle,
              whereLabel: dict.enquiry.whereLabel,
              wherePrompt: dict.enquiry.wherePrompt,
              whenLabel: dict.enquiry.whenLabel,
              whenPrompt: dict.enquiry.whenPrompt,
              partyLabel: dict.enquiry.partyLabel,
              partyPrompt: dict.enquiry.partyPrompt,
              submit: dict.enquiry.submit,
              submitHint: dict.enquiry.submitHint,
              validation: dict.enquiry.validation,
              unset: dict.enquiry.unset,
            }}
            destinations={destinations}
            months={months}
            party={party}
            waTemplate={dict.enquiry.waMessage}
            phone={dict.contact.phone}
          />
        </div>
      </div>
    </section>
  );
}
