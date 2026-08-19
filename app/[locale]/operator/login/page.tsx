import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import {
  checkPasscode,
  isOperatorAuthed,
  issueSession,
  OPERATOR_COOKIE,
} from "@/lib/operator/auth";

export const dynamic = "force-dynamic";

type Params = { locale: string };
type Search = { error?: string };

export default async function OperatorLogin({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const op = dict.operator;
  if (await isOperatorAuthed()) redirect(`/${locale}/operator`);
  const showError = (await searchParams).error === "1";

  async function login(formData: FormData) {
    "use server";
    if (!checkPasscode(formData.get("passcode")))
      redirect(`/${locale}/operator/login?error=1`);
    const store = await cookies();
    store.set(OPERATOR_COOKIE, issueSession(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    redirect(`/${locale}/operator`);
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16 md:py-24">
      <h1 className="font-display text-2xl text-ink">{op.loginTitle}</h1>
      <p className="mt-2 text-sm text-muted">{op.loginBody}</p>
      <form action={login} className="mt-6">
        <label htmlFor="passcode" className="text-sm font-medium text-ink">
          {op.passcode}
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoComplete="off"
          className="mt-1.5 w-full rounded-control border border-line bg-paper text-base text-ink transition-colors focus:border-river"
        />
        {showError ? (
          <p className="mt-2 text-sm font-medium text-ink">{op.signInError}</p>
        ) : null}
        <button
          type="submit"
          className="mt-4 w-full rounded-control bg-sun px-5 text-base font-medium text-ink transition hover:brightness-95"
        >
          {op.signIn}
        </button>
      </form>
    </div>
  );
}
