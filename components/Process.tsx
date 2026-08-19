import type { Dictionary } from "@/i18n/dictionaries";

export function Process({ dict }: { dict: Dictionary }) {
  const steps = [
    dict.process.steps.one,
    dict.process.steps.two,
    dict.process.steps.three,
  ];

  return (
    <section id="process" className="scroll-mt-16 bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-4">
          <h2 className="font-display text-2xl text-paper md:text-[40px]">
            {dict.process.title}
          </h2>
        </div>
        <ol className="md:col-span-7 md:col-start-6">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-t border-paper/20 py-7 first:border-t-0 first:pt-0"
            >
              <span className="font-display text-2xl font-semibold text-sea">
                {`0${index + 1}`}
              </span>
              <div>
                <h3 className="font-display text-lg text-paper">{step.title}</h3>
                <p className="mt-2 max-w-xl text-base text-paper/75">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
