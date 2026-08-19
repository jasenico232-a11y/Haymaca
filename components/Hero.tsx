import type { Dictionary } from "@/i18n/dictionaries";
import { destinationOrder } from "@/lib/destinations";
import { EnquiryWidget } from "./EnquiryWidget";
import { RidgeLine } from "./RidgeLine";

export function Hero({ dict }: { dict: Dictionary }) {
  const destinations = destinationOrder.map((slug) => ({
    value: slug,
    label: dict.destinations.items[slug].name,
  }));

  const months = (
    Object.keys(dict.enquiry.months) as Array<keyof Dictionary["enquiry"]["months"]>
  ).map((key) => ({ value: key, label: dict.enquiry.months[key] }));

  const party = (
    Object.keys(dict.enquiry.party) as Array<keyof Dictionary["enquiry"]["party"]>
  ).map((key) => ({ value: key, label: dict.enquiry.party[key] }));

  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-12 md:gap-8 md:py-20">
        <div className="md:col-span-7 md:pt-6">
          <p className="text-sm uppercase tracking-[0.14em] text-river">
            {dict.hero.eyebrow}
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-2xl font-semibold text-ink sm:text-3xl">
            {dict.hero.headlineLead}{" "}
            <em className="italic text-forest">{dict.hero.headlineEmphasis}</em>
            {dict.hero.headlineTrail}
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted">{dict.hero.body}</p>
          <p className="mt-5 text-base font-medium text-ink">
            {dict.hero.priceNote}
          </p>
        </div>

        <div className="md:col-span-5">
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
            }}
            destinations={destinations}
            months={months}
            party={party}
            waTemplate={dict.enquiry.waMessage}
            phone={dict.contact.phone}
          />
        </div>
      </div>

      <RidgeLine
        label={dict.a11y.decorativeRidge}
        className="block h-9 w-full text-line"
      />
    </section>
  );
}
