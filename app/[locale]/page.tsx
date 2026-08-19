import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { Destinations } from "@/components/Destinations";
import { Process } from "@/components/Process";
import { Contact } from "@/components/Contact";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <Hero dict={dict} />
      <Destinations dict={dict} />
      <Process dict={dict} />
      <Contact dict={dict} />
    </>
  );
}
