import type { Dictionary } from "@/i18n/dictionaries";

export function Contact({ dict }: { dict: Dictionary }) {
  const digits = dict.contact.phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
    dict.contact.whatsappMessage,
  )}`;

  return (
    <section id="contact" className="scroll-mt-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <h2 className="font-display text-2xl text-ink md:text-[40px]">
            {dict.contact.title}
          </h2>
          <p className="mt-4 max-w-md text-base text-muted">
            {dict.contact.body}
          </p>
          <a
            href={whatsappUrl}
            data-tap="true"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 rounded-control bg-sun px-5 text-base font-medium text-ink transition hover:brightness-95"
          >
            {dict.contact.whatsapp}
          </a>
        </div>

        <dl className="space-y-5 border-t border-line pt-8 text-base md:col-span-6 md:col-start-7 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <dt className="text-sm uppercase tracking-wide text-muted">
              {dict.contact.callLabel}
            </dt>
            <dd>
              <a
                href={`tel:${digits}`}
                data-tap="true"
                className="font-medium text-river transition-colors hover:text-ink"
              >
                {dict.contact.phone}
              </a>
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line pt-5">
            <dt className="text-sm uppercase tracking-wide text-muted">
              {dict.contact.emailLabel}
            </dt>
            <dd>
              <a
                href={`mailto:${dict.contact.email}`}
                data-tap="true"
                className="font-medium text-river transition-colors hover:text-ink"
              >
                {dict.contact.email}
              </a>
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line pt-5">
            <dt className="text-sm uppercase tracking-wide text-muted">
              {dict.contact.addressLabel}
            </dt>
            <dd className="text-right font-medium text-ink">
              {dict.contact.address}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
