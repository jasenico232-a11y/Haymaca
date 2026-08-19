import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { isOperatorAuthed } from "@/lib/operator/auth";
import { ScanConsole } from "@/components/operator/ScanConsole";

export const dynamic = "force-dynamic";

type Params = { locale: string };

export default async function ScanPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isOperatorAuthed())) redirect(`/${locale}/operator/login`);

  const op = getDictionary(locale).operator;

  return (
    <div className="mx-auto max-w-md px-5 py-10 md:py-14">
      <Link
        href={`/${locale}/operator`}
        data-tap="true"
        className="text-sm text-river transition-colors hover:text-ink"
      >
        {op.back}
      </Link>
      <h1 className="mt-4 font-display text-2xl text-ink">{op.scanTitle}</h1>
      <p className="mt-2 text-sm text-muted">{op.scanBody}</p>

      <ScanConsole
        labels={{
          scanInput: op.scanInput,
          scanButton: op.scanButton,
          online: op.online,
          offline: op.offline,
          queuedCount: op.queuedCount,
          syncNow: op.syncNow,
          resultCheckedIn: op.resultCheckedIn,
          resultAlready: op.resultAlready,
          resultInvalid: op.resultInvalid,
          resultNotConfirmed: op.resultNotConfirmed,
          resultWrongDeparture: op.resultWrongDeparture,
          cameraUnavailable: op.cameraUnavailable,
        }}
      />
    </div>
  );
}
